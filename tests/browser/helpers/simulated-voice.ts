// Synthetic protocol fixture only. Never requests a real microphone.
export async function simulateVoice(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const state = {
      stops: 0,
      sent: [] as string[],
      enabled: true,
      closed: false,
      emit: (_event: unknown) => {
        void _event;
      },
    };
    Object.defineProperty(window, "__voiceTest", { value: state });
    const track = {
      stop: () => {
        state.stops++;
      },
      get enabled() {
        return state.enabled;
      },
      set enabled(v: boolean) {
        state.enabled = v;
      },
    };
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => stream,
      configurable: true,
    });
    class Recorder {
      state = "inactive";
      mimeType = "audio/webm";
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      onstart: (() => void) | null = null;
      start() {
        this.state = "recording";
        this.onstart?.();
      }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({
          data: new Blob(["fake test audio"], { type: "audio/webm" }),
        });
        this.onstop?.();
      }
    }
    Object.defineProperty(window, "MediaRecorder", { value: Recorder });
    class Peer {
      connectionState = "new";
      onconnectionstatechange: (() => void) | null = null;
      ontrack: null = null;
      dc = {
        readyState: "open",
        onopen: null as (() => void) | null,
        onmessage: null as ((e: { data: string }) => void) | null,
        send: (text: string) => state.sent.push(text),
        close: () => {},
      };
      addTrack() {}
      createDataChannel() {
        state.emit = (e) => this.dc.onmessage?.({ data: JSON.stringify(e) });
        return this.dc;
      }
      async createOffer() {
        return { type: "offer", sdp: "v=0 test SDP and audio offer" };
      }
      async setLocalDescription() {}
      async setRemoteDescription() {
        this.connectionState = "connected";
        this.dc.onopen?.();
        this.dc.onmessage?.({
          data: JSON.stringify({
            type: "response.created",
            response: { id: "mock-greeting" },
          }),
        });
        this.dc.onmessage?.({
          data: JSON.stringify({
            type: "response.done",
            response: { id: "mock-greeting", status: "completed" },
          }),
        });
      }
      close() {
        state.closed = true;
        this.connectionState = "closed";
      }
    }
    Object.defineProperty(window, "RTCPeerConnection", { value: Peer });
  });
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { configured: true } }),
  );
  await page.route("**/api/realtime", (r) =>
    r.fulfill({ body: "v=0 simulated answer", contentType: "application/sdp" }),
  );
  await page.route("**/api/transcribe", (r) =>
    r.fulfill({ json: { text: "A dictated thought to edit." } }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
}
