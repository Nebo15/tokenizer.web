
class InputElement {
  constructor (element) {
    this.dirty = false;
    this.pristine = true;
    this.touched = false;
    this.focused = false;
    this.__value = element.value;
    this.element = element;

    this.onKeydown = this.onKeydown.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);

    element.addEventListener('keydown', this.onKeydown);
    element.addEventListener('focus', this.onFocus);
    element.addEventListener('blur', this.onBlur);
  }

  onKeydown (e) {
    this.dirty = !!this.getValue();
  }
  onFocus (e) {
    this.focused = true;
  }
  onBlur (e) {
    this.focused = false;
    this.touched = true;
  }
  getValue () {
    return this.element.value;
  }
  destroy () {
    this.element.removeEventListener('keydown', this.onKeydown);
    this.element.removeEventListener('keyup', this.onKeyup);
    this.element.removeEventListener('focus', this.onFocus);
    this.element.removeEventListener('blur', this.onBlur);
  }

  focus () {
    this.element.focus();
  }
  select () {
    this.element.select();
  }
  disable() {
    this.element.disabled = true;
  }
  setTouched() {
    this.touched = true;
  }

  getSelection () {
    var start, end, rangeEl, clone;

    if (this.element.selectionStart !== undefined) {
      start = this.element.selectionStart;
      end = this.element.selectionEnd;
    } else {
      try {
        this.element.focus();
        rangeEl = this.element.createTextRange();
        clone = rangeEl.duplicate();

        rangeEl.moveToBookmark(document.selection.createRange().getBookmark());
        clone.setEndPoint('EndToStart', rangeEl);

        start = clone.text.length;
        end = start + rangeEl.text.length;
      } catch (e) { /* not focused or not visible */ }
    }
    return { start, end };
  }

  isCursorInTheEnd () {
    var selection = this.getSelection();
    return selection.start == selection.end && selection.start == this.element.value.length;
  }
}

export default InputElement;
