
import validate from '../services/validate';

import CardPanElement from './CardPanElement';
import CardExpMonthElement from './CardExpMonthElement';
import CardExpYearElement from './CardExpYearElement';
import CardCscElement from './CardCscElement';
import CardTypeElement from './CardTypeElement';

import ErrorElement from './ErrorElement';

var KEYS = {
  backspace: 8,
};

function isNumber(e) {
  var keyCode = e.which || e.keyCode;
  return keyCode >= 48 && keyCode <= 57;
}

function getTokenizerElement(root, name) {
  return root.querySelector('[data-tokenizer-element="'+ name +'"]');
}
function getTokenizerError(root, name) {
  return root.querySelector('[data-tokenizer-error="'+ name +'"]');
}

class CardForm {
  constructor (rootElement, options = {}) {
    this.root = rootElement;
    this.messages = options.messages || CardForm.validatorMessages;

    this.inputs = {};
    this.inputs.pan = new CardPanElement(getTokenizerElement(rootElement, 'pan'));
    this.inputs.expMonth = new CardExpMonthElement(getTokenizerElement(rootElement, 'expMonth'));
    this.inputs.expYear = new CardExpYearElement(getTokenizerElement(rootElement, 'expYear'));
    this.inputs.cvv = new CardCscElement(getTokenizerElement(rootElement, 'cvv'));

    const cardTypeElement = rootElement.querySelector('[data-tokenizer-card-type]');
    this.cardType = cardTypeElement && new CardTypeElement(cardTypeElement);

    if (!this.inputs.pan) throw new Error('Undefined `pan` element');
    if (!this.inputs.cvv) throw new Error('Undefined `cvv` element');
    if (!this.inputs.expMonth) throw new Error('Undefined `expMonth` element');
    if (!this.inputs.expYear) throw new Error('Undefined `expYear` element');

    this.errors = {};
    var errorElements = rootElement.querySelectorAll('[data-tokenizer-error]');
    [].forEach.call(errorElements, (el) => {
      let value = el.getAttribute('data-tokenizer-error');
      if (!value) return;
      value = value.split('|');
      value.forEach(i => {
        if (['pan','expDate','cvv'].indexOf(i) === -1) return;
        this.errors[i] = new ErrorElement(
          el,
          rootElement.querySelector(`[data-tokenizer-error-wrap="${i}"]`)
        );
      })
    });

    this.init();
  }

  init () {
    var self = this;

    this.onInputChange = this.onInputChange.bind(this);
    Object.keys(this.inputs).forEach(function (key) {
      self.inputs[key].element.addEventListener('keyup', function (e) {
        self.onInputChange(self.inputs[key], e);
      });
      self.inputs[key].element.addEventListener('blur', function (e) {
        self.onInputChange(self.inputs[key], e);
      });

    });
  };

  onInputBlur (input, e) {
    var errors = this.validate(this.getValues()) || {};
    this.showErrors(errors);
  };
  onInputChange (input, e) {
    var keyCode = e.which || e.keyCode;
    if (e.ctrlKey || e.altKey || e.metaKey ||
      (keyCode > 90 || keyCode < 46 && [KEYS.backspace].indexOf(keyCode) === -1)
    ) return false;

    var errors = this.validate(this.getValues()) || {};
    var value = input.getValue();

    var selection = input.getSelection();
    this.showErrors(errors);

    if (keyCode == KEYS.backspace) {
      if (!value.length) return this.focusPrevInput(input);
      return true;
    }
    if (value.length === input.length && !errors[input.name] && input.isCursorInTheEnd()) this.focusNextInput(input);
  };
  focusNextInput (input) {
    var idx = CardForm.inputOrder.indexOf(input.name);
    if (idx === -1) return;

    var nextInputName = CardForm.inputOrder[idx+1];
    if (!this.inputs[nextInputName]) return;

    this.inputs[nextInputName].focus();
  };
  focusPrevInput (input) {
    var idx = CardForm.inputOrder.indexOf(input.name);
    if (idx === -1) return;

    var nextInputName = CardForm.inputOrder[idx-1];
    if (!this.inputs[nextInputName]) return;

    this.inputs[nextInputName].focus();
    this.inputs[nextInputName].select();
  };

  getValues () {
    return {
      pan: this.inputs.pan.getValue(),
      expMonth: this.inputs.expMonth.getValue(),
      expYear: this.inputs.expYear.getValue(),
      cvv: this.inputs.cvv.getValue(),
    };
  }
  validate (values) {
    if (this.cardType) this.cardType.update(values.pan);
    return (validate(values, CardForm.validators, { fullMessages: false, format: 'detailed' }) || []).reduce(
      function (cur, item) {
        cur[item.attribute] = (cur[item.attribute] || []).concat(item.validator);
        return cur;
      },
      {}
    );
  }
  disable () {
    Object.keys(this.inputs).forEach(key => {
      this.inputs[key].disable();
    });
  }
  forceTouched() {
    Object.keys(this.inputs).forEach(key => {
      this.inputs[key].setTouched();
    });
  }
  showErrors (errorObj) {
    errorObj = errorObj || {};
    var self = this;
    Object.keys(CardForm.mapErrorsToInputs).forEach(function (errorKey) {
      CardForm.mapErrorsToInputs[errorKey].reduce(function (added, inputKey) {
        if (added) return added;
        if (errorObj[inputKey] && self.inputs[inputKey].touched) {
          self.errors[errorKey].show(errorObj[inputKey].map(function (i) {
            return self.messages[i];
          }).filter(function (i) {
            return !!i;
          }));
          return true;
        } else {
          self.errors[errorKey].clear();
        }
        return added;
      }, false);
    })
  }
}

CardForm.inputOrder = ['pan','expMonth','expYear','cvv'];
CardForm.mapErrorsToInputs = {
  'expDate': ['expMonth', 'expYear'],
  'pan': ['pan'],
  'cvv': ['cvv'],
};
CardForm.validatorMessages = {
  presence: 'This field is required',
  format: 'Value has invalid format',
  length: 'Value has wrong length',
  cardNumber: 'Value has invalid card number',
};

CardForm.validators = {
  pan: {
    presence: true,
    length: {
      is: 16
    },
    cardNumber: true,
  },
  expMonth: {
    presence: true,
    length: {
      is: 2
    },
  },
  expYear: {
    presence: true,
    length: {
      is: 2
    },
  },
  cvv: {
    presence: true,
    length: {
      is: 3
    }
  },
};

export default CardForm;
