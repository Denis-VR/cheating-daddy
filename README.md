<img width="1299" height="424" alt="cd (1)" src="https://github.com/user-attachments/assets/b25fff4d-043d-4f38-9985-f832ae0d0f6e" />

## Recall.ai - API for desktop recording

If you’re looking for a hosted desktop recording API, consider checking out [Recall.ai](https://www.recall.ai/product/desktop-recording-sdk/?utm_source=github&utm_medium=sponsorship&utm_campaign=sohzm-cheating-daddy), an API that records Zoom, Google Meet, Microsoft Teams, in-person meetings, and more.

This project is sponsored by Recall.ai.

---

> [!NOTE]  
> Use latest MacOS and Windows version, older versions have limited support

> [!NOTE]  
> During testing it wont answer if you ask something, you need to simulate interviewer asking question, which it will answer

A real-time AI assistant that provides contextual help during video calls, interviews, presentations, and meetings using screen capture and audio analysis.

## Features

- **Live AI Assistance**: Real-time help powered by Google Gemini 2.0 Flash Live
- **Screen & Audio Capture**: Analyzes what you see and hear for contextual responses
- **Multiple Profiles**: Interview, Sales Call, Business Meeting, Presentation, Negotiation
- **Transparent Overlay**: Always-on-top window that can be positioned anywhere
- **Click-through Mode**: Make window transparent to clicks when needed
- **Cross-platform**: Works on macOS, Windows, and Linux (kinda, dont use, just for testing rn)

## Setup

1. **Get a Gemini API Key**: Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. **Install Dependencies**: `npm install`
3. **Run the App**: `npm start`

## Usage

1. Enter your Gemini API key in the main window
2. Choose your profile and language in settings
3. Click "Start Session" to begin
4. Position the window using keyboard shortcuts
5. The AI will provide real-time assistance based on your screen and what interview asks

## Keyboard Shortcuts

- **Window Movement**: `Ctrl/Cmd + Arrow Keys` - Move window
- **Click-through**: `Ctrl/Cmd + M` - Toggle mouse events
- **Close/Back**: `Ctrl/Cmd + \` - Close window or go back
- **Send Message**: `Enter` - Send text to AI

## Audio Capture

- **macOS**: [SystemAudioDump](https://github.com/Mohammed-Yasin-Mulla/Sound) for system audio
- **Windows**: Loopback audio capture
- **Linux**: Microphone input

## Requirements

- Electron-compatible OS (macOS, Windows, Linux)
- Gemini API key
- Screen recording permissions
- Microphone/audio permissions

## OpenAI / OpenRouter and reading during calls

Start with `npm install` and `npm start`. On Home select **OpenRouter · OpenAI models** or **OpenAI**, enter that provider's API key, and keep the default response model or enter a compatible model ID. OpenRouter model IDs must start with `openai/`; the default is `openai/gpt-4o-mini`. Direct OpenAI defaults to `gpt-4o-mini`.

Both hosted modes use Whisper for transcription and the selected chat model for answers. In OpenRouter mode screenshots first go through a separate low-cost OCR model. OpenRouter uses its own transcription endpoint and the same OpenRouter key; a separate OpenAI key is unnecessary. Direct OpenAI uses `whisper-1`. ChatGPT subscriptions do not include these API charges. Authentication, quota and stream errors are shown in the application, with no silent switch to another provider.

- Recognized speech enters an editable question inbox. Approve a question to generate an answer. New topic cards do not move the answer you are reading or reset its scroll position.
- Use the response arrows, **next · N waiting**, or **Cmd/Ctrl + [ / ]** to change answers.
- **Pause / Resume** or **Cmd/Ctrl + P** stops new audio processing only. Text questions and Analyze Screen remain available; their answers are appended to the response card where you asked, without opening another card. Manual requests already in progress finish; queued audio is discarded. Audio during pause is discarded. Pausing does not revoke OS capture permissions or stop the OS recording indicator.
- End the session to stop capture, cancel the hosted request, and discard pending work. Starting a new session clears conversational context.
- Audio modes in Settings select system sound, microphone or both. System sound and microphone use separate speech buffers. Short silence is filtered locally; audio is resampled to mono 16 kHz before upload. Long speech is split at 20 seconds. This energy-based VAD is not speaker diarization or acoustic echo cancellation; headphones help when capturing both channels.

Hosted audio is sent to the selected provider for transcription; text/context and manually captured screenshots are sent for responses. API keys are stored in the existing local `cheating-daddy-config/credentials.json`, outside the repository. Conversation text and screen analyses use the existing local history. On macOS this directory is `~/Library/Application Support/cheating-daddy-config`. Hosted processing does not persist raw audio unless the existing `DEBUG_AUDIO` option is enabled. Use History controls to delete saved sessions.

Verification: `npm test` runs the Node test suite for streaming, ordered requests, cancellation, speech segmentation, pause and reading position. `npm run package` packages the Electron app. This JavaScript repository currently has no `typecheck` script; `npm run lint` is a placeholder.

API references: [OpenRouter transcription](https://openrouter.ai/blog/tutorials/transcription-on-openrouter/), [OpenAI speech-to-text](https://developers.openai.com/api/docs/guides/speech-to-text).

Analyze Screen captures a JPEG draft; **📎 Скриншот** and paste attach images up to 10 MB each. Hosted modes offer editable OCR or direct vision. OpenRouter OCR defaults to `google/gemini-2.5-flash-lite`; the selected answer model receives the reviewed text in OCR mode, or full images in vision mode. OCR can misread small text and does not preserve diagrams. Images are resized to at most 1920 pixels wide. Markdown tables have horizontal scrolling. [OCR model details](https://openrouter.ai/google/gemini-2.5-flash-lite).

## Saved instruction sets

Open **AI Customization → Новый набор**, enter a name and instructions, then choose **Сохранить и использовать**. The set marked ✓ is applied at the next session start, alongside the selected base profile. Switch to another set and save to activate it. Existing custom instructions migrate into **Мои инструкции** without changing their text. Sets are stored in the existing preferences file; active sessions retain their original prompt.

Returning from a session cancels capture startup and clears the start guard, including when permission dialogs or cleanup fail. A late capture permission result cannot revive an ended session. The upstream update button and automatic update checks are disabled for this fork.

### Manual answer cards and screenshot drafts

Use **+ Новое окно ответа** to open an empty response card (navigate between cards with the arrows).
Pasting or choosing a screenshot attaches a draft: add your task in the text field, then click **Отправить** or press Enter.
**Убрать** removes the attachment. In hosted modes Analyze Screen captures a draft for review before sending.

### Local macOS signing

Packaged builds use the stable bundle ID `com.denis.cheatingdaddy`. To preserve macOS privacy identity across updates, package with the same signing certificate every time:

```sh
CD_SIGN_IDENTITY='<your Apple Development identity or certificate hash>' npm run package
```

Use `security find-identity -v -p codesigning` to list available certificates. An unsigned build has a different identity.
After moving from the old Electron identity, grant Screen & System Audio Recording to the new installed application once and fully quit/relaunch it.
The app no longer requests screen access on launch; capture begins only when starting a session.

### Profiles, history and persistence

AI Customization has a profile list and a full-text editor, plus a separate tab for additional instructions.
Create/edit/delete drafts, then click **Сохранить и использовать** to persist and select them for the next session.
All six built-in profiles are editable; deleting every profile enables a mode using only additional instructions.
Deleting the final additional-instruction set creates an empty set. Existing Java/Go or other user sets are preserved.

History supports deletion of one session or all sessions with confirmation. This does not remove credentials or preferences.
Window dimensions are saved on resize/close and restored within the current display. Font size, theme and opacity are restored at startup.
Settings writes are atomic; startup no longer wipes user data when the configuration version changes.

## Interview workspace (OpenAI / OpenRouter)

See [the Russian pre-interview checklist](docs/INTERVIEW_CHECKLIST_RU.md) for setup, verification and limits.

Speech now enters an editable question inbox: nearby fragments are combined, acknowledgements filtered, and generation starts after approval. Answers have three levels with expandable details and follow-up shortcuts. Topics use a compact list with grouping, splitting and deletion.

Preparation stores named vacancy packages with resume documents (PDF/DOCX/text), vacancy details and real project stories. The selected package is captured at session start; relevant excerpts accompany questions, with explicit instructions not to invent experience.

Screenshots attach to the regular message composer, with OCR or full-image analysis. Paste, attachment and Analyze Screen prepare drafts. Add your task in the regular text field, choose OCR or vision, then send. OCR uses the configured inexpensive model; vision sends images to the selected response model. These explicit controls supersede the older automatic screenshot flow described above.

Technical mode structures solutions and offers manual Go/Python/SQLite checks in restricted Docker containers. System design keeps editable requirements, load, API, storage, components and decisions, renders a simple diagram, and retains ten rollback versions. Local workspace data is saved in `interview-workspace.json` beside preferences; raw imported documents and screenshots are not persisted there.

### Live session controls

Use the small **A− / A+** buttons to change answer text size during a session (12–48 px, saved immediately). Default shortcuts are **Cmd+Alt+Up/Down** on macOS and **Ctrl+Alt+Up/Down** elsewhere; customize them in Settings → Keyboard Shortcuts. Tools open in an opaque panel within the layout; The arrow collapses and reopens the selected panel. Submitted text clears immediately; failed requests restore it if no newer draft was typed.

**Снять экран** (previously Analyze Screen) attaches a screen capture to the composer without sending it to AI. It requests a native Electron screenshot of the display containing the app, independently of the session video stream. Capture has a 10-second timeout (12 seconds in the renderer). Add a task and press Send to process the attachment.

Code blocks use the bundled Highlight.js engine and a stylesheet inside the answer component. User questions are shown at 14 px; redundant answer labels are hidden.

### Session reliability

Home offers a readiness check (real model completion and latency, native screenshot, six seconds of macOS system-audio level measurement, and microphone signal when selected). Only the synthetic text probe goes to the model. Answer-only mode hides tools and toggles with Cmd/Ctrl+Shift+F, configurable in Settings.

Hosted sessions save local recovery checkpoints each second and on normal window shutdown. Home can resume the original history with topic cards, text draft, attachment drafts and reading position. Failed or interrupted manual requests have an explicit retry in the same card; no automatic resubmission. Checkpoints are removed when a session ends or the user chooses to start over. See the Russian checklist for limits and privacy details.

History automatically derives an evidence-based, local review: repeated/clarified topics, answers requiring verification, and next-day exercises. This is a heuristic review of recorded questions and AI responses, not a judgment of the candidate's spoken performance.
