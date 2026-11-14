import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { IconButton } from "@/components/IconButton";
import type { MenuBoard } from "@/data/menu-schema";
import { apiUrl } from "@/lib/api";
import { speak, stopSpeech } from "@/lib/speech";
import type { CartLine } from "../cart";
import { orderText, requestPhrases } from "../order";
import { Toolbar } from "../shared";

export function Order({ board, cart, request, setRequest, go }: {
  board: MenuBoard; cart: CartLine[]; request: string; setRequest: (value: string) => void; go: (route: string) => void;
}) {
  const [translation, setTranslation] = useState<{ input: string; text: string }>({ input: "", text: "" });
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const input = request.trim();
  const known = requestPhrases[input];
  const translated = known ?? (translation.input === input ? translation.text : "");
  const pending = !!input && !translated;
  const text = orderText(board, cart);
  const italian = `${text.italian}${translated ? ` ${translated}` : ""}`;

  useEffect(() => {
    if (!input || known) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(apiUrl("/api/translate-request"), {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: input }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(25_000)]),
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (typeof data.translation !== "string" || !data.translation.trim() || data.translation.length > 2000) throw new Error();
        if (!controller.signal.aborted) setTranslation({ input, text: data.translation });
      } catch {
        if (!controller.signal.aborted) setError("요청사항을 번역하지 못했어요. 연결을 확인하고 다시 시도해 주세요.");
      }
    }, 700);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [input, known, retry]);
  useEffect(() => () => stopSpeech(), []);

  async function listen() {
    if (speaking) { stopSpeech(); setSpeaking(false); return; }
    setSpeaking(true);
    try { await speak(italian); } catch (error) { setError(error instanceof Error ? error.message : "음성을 재생하지 못했어요"); }
    finally { setSpeaking(false); }
  }
  return <main className="page order-page" data-screen="order">
    <Toolbar title="주문하기" onBack={() => go("cart")} />
    <div className="page-content order-content">
      {text.korean ? <><Card className="order-sentence">
        <p className="t-body-sm muted">한국어</p>
        <p>{text.korean}{input && ` ${input}`}</p>
        <hr />
        <div className="section-heading"><span className="t-body-sm muted">이탈리아어</span><div className="inline">
          <IconButton icon="added" iconSrc="/figma/43c20.svg" tone="neutral" label={speaking ? "듣기 멈추기" : "주문 문장 듣기"} disabled={pending} onClick={() => void listen()} />
          <span ref={element => { expandButton.current = element?.querySelector("button") ?? null; }}><IconButton icon="added" iconSrc="/figma/a89fe.svg" tone="neutral" label="주문 문장 확대" disabled={pending} onClick={() => dialog.current?.showModal()} /></span>
        </div></div>
        <p className="order-italian" lang="it">{italian}</p>
      </Card>
      <Card className="request-card"><label className="t-title-md" htmlFor="order-request">요청사항</label>
        <textarea id="order-request" maxLength={500} value={request} placeholder={"입력하면 주문 문장에 바로 반영돼요.\n예: 치즈는 빼주세요"} onChange={event => { stopSpeech(); setSpeaking(false); setError(""); setRequest(event.target.value); }} />
        {input && <p className="t-body-sm muted" role="status">{pending ? (error ? "요청사항 번역이 필요해요" : "요청사항을 이탈리아어로 번역하고 있어요") : "요청사항을 주문 문장에 반영했어요"}</p>}
        {input && !known && <p className="t-body-sm muted">요청사항을 Gemini로 보내 번역해요.</p>}
      </Card></> : <Card className="stack-lg"><p>아직 담은 메뉴가 없어요</p><Button variant="secondary" onClick={() => go("menu")}>메뉴 고르러 가기</Button></Card>}
      {error && <div className="stack-sm"><p className="analysis-error t-body-sm" role="alert">{error}</p>{pending && <Button variant="secondary" onClick={() => { setError(""); setRetry(value => value + 1); }}>다시 번역하기</Button>}</div>}
    </div>
    <div className="order-footer"><Button variant="primary" disabled={!text.korean || pending} onClick={() => go("receipt")}>영수증 보기</Button></div>
    <dialog ref={dialog} className="order-expanded" aria-label="직원에게 주문 문장 보여주기" onClose={() => expandButton.current?.focus()}>
      <IconButton icon="close" label="확대 닫기" tone="neutral" onClick={() => dialog.current?.close()} />
      <p lang="it">{italian}</p>
    </dialog>
  </main>;
}
