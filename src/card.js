import CardForm from './models/CardForm'
import { API_HOST, BASIC_CREDENTIALS } from './config';

class App {
  constructor(el, options = {}) {
    this.form = new CardForm(el, {
      messages: options.langpack
    });
    this.onMessage = this.onMessage.bind(this);
    this.subscribe();
  }

  onMessage (event) {
    switch (event.data.action) {
      case 'disable':
      this.form.disable();
      break;
      case 'getToken':
      this.onGetToken(event);
      break;
    }
  }
  subscribe () {
    if (window.addEventListener) window.addEventListener("message", this.onMessage);
    else window.attachEvent("onmessage", this.onMessage); // IE8
  }
  unsubscribe () {
    if (window.addEventListener) window.removeEventListener("message", this.onMessage);
    else window.detachEvent("onmessage", this.onMessage); // IE8
  }

  onGetToken (event) {
    var values = this.form.getValues();

    return this.$$request('/tokens', {
      method: 'POST',
      body: {
        type: "card",
        number: values.pan,
        expiration_month: values.expMonth,
        expiration_year: '20' + values.expYear,
        cvv: values.cvv,
      }
    })
    .then(resp => event.source.postMessage({ action: 'getToken', payload: resp.data }, '*'))
    .catch(error => {
      this.form.forceTouched();
      this.form.showErrors(this.mapServerErrors(error));
    });
  }

  mapServerErrors (errorResponse) {
    function serverErrorRulesToClient (serverRule) {
      return App.mapServerRuleToClient[serverRule] || serverRule;
    }
    function errorsFromRules (rules) {
      return rules.map(function (i) {
        return serverErrorRulesToClient(i.rule);
      });
    }
    function entryToFieldName (entry) {
      return App.mapServerFieldToForm[entry.match(/^\$\.(.*)/)[1]];
    }
    return errorResponse.error.invalid.reduce(function (cur, i) {
      cur[entryToFieldName(i.entry)] = errorsFromRules(i.rules);
      return cur;
    }, {});
  };

  $$request (url, options) {
    return fetch(API_HOST + url, {
      method: options.method,
      headers: Object.assign({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${BASIC_CREDENTIALS}`,
      }, options.headers),
      body: options.body ? JSON.stringify(options.body) : null,
    }).then(function (payload) {
      return payload.json().then(function (resp) {
        if (payload.status >= 400) {
          return Promise.reject(resp);
        }
        return resp;
      });
    });
  }
}

App.mapServerFieldToForm = {
  cvv: 'cvv',
  expiration_month: 'expMonth',
  expiration_year: 'expYear',
  number: 'pan',
};
App.mapServerRuleToClient = {
  required: 'presence',
  card_number: 'cardNumber',
  format: 'format'
}

let langpack = null;
if (window.LANGPACK) {
  try {
    langpack = JSON.parse(unescape(window.LANGPACK));
  } catch (e) {
    console.error('Failed to parse LANGPACK from server');
  }
}

window.app = new App(document.getElementById('root'), {
  langpack,
});
