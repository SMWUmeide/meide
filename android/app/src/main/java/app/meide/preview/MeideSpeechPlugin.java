package app.meide.preview;

import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

/** Uses the device TTS engine: no microphone permission or recording. */
@CapacitorPlugin(name = "MeideSpeech")
public class MeideSpeechPlugin extends Plugin {
    private TextToSpeech engine;
    private boolean ready = false;
    private PluginCall pending;
    private String activeId;

    @Override public void load() {
        getActivity().runOnUiThread(() -> {
            engine = new TextToSpeech(getContext(), status -> {
                ready = status == TextToSpeech.SUCCESS;
            });
            engine.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) {}
                @Override public void onDone(String id) { complete(id, false); }
                @Override public void onError(String id) { complete(id, true); }
                @Override public void onStop(String id, boolean interrupted) { complete(id, false); }
            });
        });
    }
    private void complete(String id, boolean failed) {
        getActivity().runOnUiThread(() -> {
            if (pending == null || !id.equals(activeId)) return;
            PluginCall call = pending; pending = null; activeId = null;
            if (failed) call.reject("음성을 재생하지 못했어요. 확대해서 보여주세요");
            else call.resolve();
        });
    }
    private void stopCurrent() {
        if (engine != null) engine.stop();
        if (pending != null) { pending.resolve(); pending = null; activeId = null; }
    }
    @PluginMethod public void speak(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            String text = call.getString("text", "");
            if (!ready || engine == null) { call.reject("음성 엔진을 준비하지 못했어요. 잠시 후 다시 시도해 주세요"); return; }
            if (text.isEmpty() || text.length() > TextToSpeech.getMaxSpeechInputLength()) { call.reject("문장이 너무 길어요. 확대해서 보여주세요"); return; }
            stopCurrent();
            int language = engine.setLanguage(Locale.forLanguageTag(call.getString("language", "it-IT")));
            if (language == TextToSpeech.LANG_MISSING_DATA || language == TextToSpeech.LANG_NOT_SUPPORTED) {
                call.reject("기기 설정에서 이탈리아어 음성을 설치해 주세요. 확대해서 보여줄 수도 있어요"); return;
            }
            engine.setSpeechRate(0.85f);
            pending = call; activeId = call.getCallbackId();
            if (engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, activeId) == TextToSpeech.ERROR) complete(activeId, true);
        });
    }
    @PluginMethod public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> { stopCurrent(); call.resolve(); });
    }
    @Override protected void handleOnPause() { stopCurrent(); }
    @Override protected void handleOnDestroy() { stopCurrent(); if (engine != null) engine.shutdown(); }
}
