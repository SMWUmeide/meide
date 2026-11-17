import { Buffer } from 'node:buffer';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateCode() {
  let code;
  do { code = Array.from({ length: 8 }, () => alphabet[randomInt(alphabet.length)]).join(''); } while (!/[A-Z]/.test(code) || !/[0-9]/.test(code));
  return code;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class InviteRegistry {
  constructor(rows = [], makeCode = generateCode) {
    this.makeCode = makeCode;
    this.rows = rows;
    if (!Array.isArray(this.rows)) throw new Error('Invalid invite registry');
  }
  commit(rows) { this.rows = rows; }
  register({ id, token, name }) {
    if (!uuid.test(id ?? '') || !uuid.test(token ?? '') || typeof name !== 'string' || !name.trim() || name.trim().length > 20 || /[\u0000-\u001f\u007f]/.test(name)) throw Object.assign(new Error('초대 정보를 확인해 주세요.'), {status:400});
    id = id.toLowerCase(); name = name.trim();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const existing = this.rows.find(row => row.id === id);
    if (existing) {
      if (!timingSafeEqual(Buffer.from(existing.tokenHash, 'hex'), Buffer.from(tokenHash, 'hex'))) throw Object.assign(new Error('초대 정보를 확인할 수 없어요.'), {status:403});
      if (existing.name !== name) this.commit(this.rows.map(row => row.id === id ? {...row,name} : row));
      return { id, name, code: existing.code };
    }
    if(this.rows.length>=100)throw Object.assign(new Error('테스트 사용자 등록 한도에 도달했어요.'),{status:429});
    for (let attempt = 0; attempt < 100; attempt++) {
      const code = this.makeCode();
      if (this.rows.some(row => row.code === code)) continue;
      this.commit([...this.rows, { id, name, code, tokenHash }]);
      return { id, name, code };
    }
    throw Object.assign(new Error('초대 코드를 만들지 못했어요. 다시 시도해 주세요.'), {status:503});
  }
  authenticate({id, token}) {
    if (!uuid.test(id ?? '') || !uuid.test(token ?? '')) throw Object.assign(new Error('사용자 정보를 확인해 주세요.'), {status:401});
    const row = this.rows.find(person => person.id === id.toLowerCase());
    const hash = createHash('sha256').update(token).digest();
    if (!row || !timingSafeEqual(Buffer.from(row.tokenHash, 'hex'), hash)) throw Object.assign(new Error('사용자 정보를 확인해 주세요.'), {status:401});
    return row;
  }
  list(credentials) {
    const own = this.authenticate(credentials);
    return this.rows.filter(row => (own.friends ?? []).includes(row.id)).map(({id,name}) => ({id,name}));
  }
  accept({id,token,code}) {
    const own = this.authenticate({id,token});
    const other = this.find(code);
    if (other.id === own.id) throw Object.assign(new Error('내 초대 링크예요. 동반인에게 보내주세요.'),{status:400});
    this.commit(this.rows.map(row => {
      if (row.id === own.id) return {...row, friends:[...new Set([...(row.friends ?? []), other.id])]};
      if (row.id === other.id) return {...row, friends:[...new Set([...(row.friends ?? []), own.id])]};
      return row;
    }));
    return this.list({id,token});
  }
  remove({id,token,friendId}) {
    const own = this.authenticate({id,token});
    if (!uuid.test(friendId ?? '')) throw Object.assign(new Error('동반인 정보를 확인해 주세요.'), {status:400});
    this.commit(this.rows.map(row => row.id === own.id ? {...row, friends:(row.friends ?? []).filter(friend => friend !== friendId)} : row.id === friendId ? {...row,friends:(row.friends ?? []).filter(friend => friend !== own.id)} : row));
    return this.list({id,token});
  }
  find(code) {
    if (typeof code !== 'string' || !/^[A-Z0-9]{8}$/.test(code)) throw Object.assign(new Error('영문과 숫자로 된 8자리 코드를 입력해 주세요.'), {status:400});
    const row = this.rows.find(row => row.code === code);
    if (!row) throw Object.assign(new Error('초대 코드를 찾을 수 없어요. 다시 확인해 주세요.'), {status:404});
    return { id: row.id, name: row.name };
  }
}

export class InviteStore extends InviteRegistry {
  constructor(file,makeCode=generateCode) {
    super(existsSync(file)?JSON.parse(readFileSync(file,'utf8')):[],makeCode);
    this.file=file;
  }
  commit(rows) {
    mkdirSync(dirname(this.file),{recursive:true});
    writeFileSync(this.file+'.tmp',JSON.stringify(rows),{mode:0o600});
    renameSync(this.file+'.tmp',this.file);this.rows=rows;
  }
}
