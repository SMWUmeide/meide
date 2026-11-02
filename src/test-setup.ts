import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);
// jsdom은 dialog의 브라우저 API를 구현하지 않아요. 열림 상태만 보완해요.
HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };

window.PointerEvent = MouseEvent as typeof PointerEvent;
HTMLElement.prototype.setPointerCapture = function () {};
