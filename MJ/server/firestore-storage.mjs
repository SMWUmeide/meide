import { Buffer } from 'node:buffer';
import { InviteRegistry } from './invite-store.mjs';

const unavailable=()=>Object.assign(new Error('저장된 정보를 확인하지 못해 요청을 중단했어요.'),{status:503});
export class FirestoreRecord {
  constructor(db,path) {this.db=db;this.ref=db.doc(path);}
  async transaction(change) {
    try {
      return await this.db.runTransaction(async transaction=>{
        const snapshot=await transaction.get(this.ref);
        // Missing cloud state never resets quotas or identities to an empty file.
        if(!snapshot.exists)throw unavailable();
        const previous=snapshot.data().serialized;
        if(typeof previous!=='string')throw unavailable();
        const value=JSON.parse(previous);
        const result=change(value);
        if(result&&typeof result.then==='function')throw new Error('Transaction callbacks must not perform asynchronous work.');
        const serialized=JSON.stringify(value);
        if(Buffer.byteLength(serialized)>800000)throw unavailable();
        if(serialized!==previous)transaction.set(this.ref,{serialized,updatedAt:new Date().toISOString()});
        return result;
      },{maxAttempts:5});
    }catch(error){if(error.status)throw error;throw unavailable();}
  }
}

export class FirestoreInviteStore {
  constructor(record) {this.record=record;}
  invoke(method,input) {
    return this.record.transaction(data=>{
      if(data.version!==1||!Array.isArray(data.rows))throw unavailable();
      const registry=new InviteRegistry(data.rows);
      const result=registry[method](input);data.rows=registry.rows;return result;
    });
  }
  register(input){return this.invoke('register',input);}
  authenticate(input){return this.invoke('authenticate',input);}
  list(input){return this.invoke('list',input);}
  accept(input){return this.invoke('accept',input);}
  remove(input){return this.invoke('remove',input);}
  find(code){return this.invoke('find',code);}
}

export class FirestoreLedger {
  constructor(record) {this.record=record;this.shared=true;}
  transaction(change){return this.record.transaction(change);}
}

export async function createFirestoreStorage(env=process.env) {
  const projectId=env.GOOGLE_CLOUD_PROJECT,namespace=env.FIRESTORE_NAMESPACE??'pilot-2026-11';
  if(!projectId||!/^[a-zA-Z0-9_-]{1,80}$/.test(namespace))throw Error('Set GOOGLE_CLOUD_PROJECT and a valid FIRESTORE_NAMESPACE.');
  if(env.K_SERVICE&&env.FIRESTORE_EMULATOR_HOST)throw Error('Cloud Run must not use an emulator.');
  const {Firestore}=await import('@google-cloud/firestore');
  const db=new Firestore({projectId,databaseId:env.FIRESTORE_DATABASE_ID??'(default)'});
  return {
    db,
    store:new FirestoreInviteStore(new FirestoreRecord(db,`meidePrivate/${namespace}-invites`)),
    ledger:new FirestoreLedger(new FirestoreRecord(db,`meidePrivate/${namespace}-usage`)),
    async ready(){await Promise.all([db.doc(`meidePrivate/${namespace}-invites`).get(),db.doc(`meidePrivate/${namespace}-usage`).get()]).then(snapshots=>{if(snapshots.some(snapshot=>!snapshot.exists))throw unavailable();});},
    async close(){await db.terminate();},
  };
}
