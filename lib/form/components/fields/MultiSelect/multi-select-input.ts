// multi-select-input.ts

export type Item = {
  id: string;
  label: string;
};

export class MultiSelectInput extends HTMLElement {
  static formAssociated = true;

  #internals: ElementInternals;
  #value: Item[] = [];
  #min: number | null = null;
  #max: number | null = null;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['required', 'min', 'max'];
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'min') this.#min = newValue ? parseInt(newValue, 10) : null;
    if (name === 'max') this.#max = newValue ? parseInt(newValue, 10) : null;
    this.#validate();
  }

  get value(): Item[] {
    return this.#value;
  }

  set value(items: Item[]) {
    this.#value = items;
    this.#internals.setFormValue(JSON.stringify(items));
    this.#validate();
    this.#render();
  }

  #validate() {
    const flags: ValidityStateFlags = {};
    let message = '';

    if (this.hasAttribute('required') && this.#value.length === 0) {
      flags.valueMissing = true;
      message = 'Please select at least one item';
    } else if (this.#min !== null && this.#value.length < this.#min) {
      flags.rangeUnderflow = true;
      message = `Please select at least ${this.#min} items`;
    } else if (this.#max !== null && this.#value.length > this.#max) {
      flags.rangeOverflow = true;
      message = `Please select no more than ${this.#max} items`;
    }

    if (message) {
      this.#internals.setValidity(
        flags,
        message,
        this.shadowRoot?.querySelector('.anchor') ?? undefined,
      );
    } else {
      this.#internals.setValidity({});
    }
  }

  #render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .chips { display: flex; flex-wrap: wrap; gap: 4px; }
        .chip {
          background: #e0e0e0;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 14px;
        }
        .anchor { display: inline-block; }
      </style>
      <div class="chips anchor">
        ${this.#value.map((item) => `<span class="chip">${item.label}</span>`).join('')}
        ${this.#value.length === 0 ? '<span class="placeholder">No items selected</span>' : ''}
      </div>
    `;
  }

  // Constraint Validation API surface
  get validity() {
    return this.#internals.validity;
  }
  get validationMessage() {
    return this.#internals.validationMessage;
  }
  get willValidate() {
    return this.#internals.willValidate;
  }
  checkValidity() {
    return this.#internals.checkValidity();
  }
  reportValidity() {
    return this.#internals.reportValidity();
  }

  connectedCallback() {
    this.#render();
  }
}

customElements.define('multi-select-input', MultiSelectInput);
