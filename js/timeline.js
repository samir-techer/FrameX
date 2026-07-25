// ==========================================================================
// FrameX — Timeline Controller
// Owns the visual timeline: renders clips into track lanes, and handles
// drag-to-move, trim-handle resizing, split, ripple delete, snapping,
// and zoom. Emits events back to editor.js rather than touching Firestore
// or the video element directly, so it stays reusable/testable.
// ==========================================================================

const PIXELS_PER_SECOND_BASE = 40;

export class TimelineController {
  /**
   * @param {Object} opts
   * @param {HTMLElement} opts.tracksEl - container with .track-lane elements
   * @param {HTMLElement} opts.playheadEl
   * @param {Function} opts.onSeek - called with seconds when user scrubs/clicks
   * @param {Function} opts.onSelect - called with clip id when a clip is selected
   * @param {Function} opts.onChange - called whenever clips array mutates
   */
  constructor({ tracksEl, playheadEl, onSeek, onSelect, onChange }) {
    this.tracksEl = tracksEl;
    this.playheadEl = playheadEl;
    this.onSeek = onSeek;
    this.onSelect = onSelect;
    this.onChange = onChange;

    this.clips = []; // { id, track: 'video'|'audio'|'text', start, duration, label, src }
    this.zoom = 1;
    this.snapEnabled = true;
    this.selectedClipId = null;

    this._dragState = null;
    this._bindGlobalPointerEvents();
  }

  get pxPerSecond() {
    return PIXELS_PER_SECOND_BASE * this.zoom;
  }

  setZoom(zoom) {
    this.zoom = Math.min(4, Math.max(0.25, zoom));
    this.render();
  }

  setSnap(enabled) {
    this.snapEnabled = enabled;
  }

  loadClips(clips) {
    this.clips = clips || [];
    this.render();
  }

  addClip(clip) {
    const lastOnTrack = this.clips.filter((c) => c.track === clip.track);
    const start = lastOnTrack.length
      ? Math.max(...lastOnTrack.map((c) => c.start + c.duration))
      : 0;
    const newClip = { id: crypto.randomUUID(), start, ...clip };
    this.clips.push(newClip);
    this.render();
    this.onChange?.(this.clips);
    return newClip;
  }

  removeClip(clipId, ripple = false) {
    const clip = this.clips.find((c) => c.id === clipId);
    if (!clip) return;
    this.clips = this.clips.filter((c) => c.id !== clipId);

    if (ripple) {
      this.clips
        .filter((c) => c.track === clip.track && c.start > clip.start)
        .forEach((c) => (c.start -= clip.duration));
    }
    this.render();
    this.onChange?.(this.clips);
  }

  splitClipAt(clipId, timeSeconds) {
    const clip = this.clips.find((c) => c.id === clipId);
    if (!clip) return;
    const offset = timeSeconds - clip.start;
    if (offset <= 0.05 || offset >= clip.duration - 0.05) return;

    const secondHalf = {
      ...clip,
      id: crypto.randomUUID(),
      start: timeSeconds,
      duration: clip.duration - offset,
      trimStart: (clip.trimStart || 0) + offset,
    };
    clip.duration = offset;

    this.clips.push(secondHalf);
    this.render();
    this.onChange?.(this.clips);
  }

  getTotalDuration() {
    if (!this.clips.length) return 0;
    return Math.max(...this.clips.map((c) => c.start + c.duration));
  }

  setPlayhead(seconds) {
    const x = 84 + seconds * this.pxPerSecond;
    this.playheadEl.style.left = `${x}px`;
  }

  render() {
    // Clear each lane, then rebuild clip elements from the model.
    ['video', 'audio', 'text'].forEach((track) => {
      const lane = this.tracksEl.querySelector(`[data-track-lane="${track}"]`);
      if (!lane) return;
      lane.innerHTML = '';
      this.clips
        .filter((c) => c.track === track)
        .forEach((clip) => lane.appendChild(this._buildClipEl(clip)));
    });
  }

  _buildClipEl(clip) {
    const el = document.createElement('div');
    el.className = `timeline-clip ${clip.track === 'audio' ? 'audio' : ''} ${clip.track === 'text' ? 'text' : ''} ${clip.id === this.selectedClipId ? 'selected' : ''}`;
    el.style.left = `${clip.start * this.pxPerSecond}px`;
    el.style.width = `${Math.max(clip.duration * this.pxPerSecond, 24)}px`;
    el.dataset.clipId = clip.id;
    el.textContent = clip.label || 'Clip';

    const leftHandle = document.createElement('div');
    leftHandle.className = 'trim-handle left';
    leftHandle.dataset.handle = 'left';
    const rightHandle = document.createElement('div');
    rightHandle.className = 'trim-handle right';
    rightHandle.dataset.handle = 'right';
    el.append(leftHandle, rightHandle);

    el.addEventListener('pointerdown', (e) => this._onClipPointerDown(e, clip));
    return el;
  }

  _onClipPointerDown(e, clip) {
    e.stopPropagation();
    this.selectedClipId = clip.id;
    this.onSelect?.(clip.id);

    const handle = e.target.dataset.handle;
    this._dragState = {
      clip,
      handle: handle || 'move',
      startX: e.clientX,
      originalStart: clip.start,
      originalDuration: clip.duration,
    };
    this.render();
  }

  _bindGlobalPointerEvents() {
    window.addEventListener('pointermove', (e) => {
      if (!this._dragState) return;
      const { clip, handle, startX, originalStart, originalDuration } = this._dragState;
      const deltaSeconds = (e.clientX - startX) / this.pxPerSecond;

      if (handle === 'move') {
        clip.start = this._maybeSnap(Math.max(0, originalStart + deltaSeconds));
      } else if (handle === 'left') {
        const newStart = Math.max(0, originalStart + deltaSeconds);
        const newDuration = originalDuration - (newStart - originalStart);
        if (newDuration > 0.2) {
          clip.start = this._maybeSnap(newStart);
          clip.duration = newDuration;
        }
      } else if (handle === 'right') {
        const newDuration = Math.max(0.2, originalDuration + deltaSeconds);
        clip.duration = newDuration;
      }
      this.render();
    });

    window.addEventListener('pointerup', () => {
      if (this._dragState) {
        this._dragState = null;
        this.onChange?.(this.clips);
      }
    });

    this.tracksEl.addEventListener('click', (e) => {
      // Clicking empty timeline space scrubs the playhead.
      if (e.target === this.tracksEl || e.target.classList.contains('track-lane')) {
        const rect = this.tracksEl.getBoundingClientRect();
        const seconds = Math.max(0, (e.clientX - rect.left - 84) / this.pxPerSecond);
        this.onSeek?.(seconds);
      }
    });
  }

  _maybeSnap(value) {
    if (!this.snapEnabled) return value;
    const snapPoints = [0, ...this.clips.flatMap((c) => [c.start, c.start + c.duration])];
    const threshold = 6 / this.pxPerSecond; // ~6px snap radius
    for (const point of snapPoints) {
      if (Math.abs(point - value) < threshold) return point;
    }
    return value;
  }
}
