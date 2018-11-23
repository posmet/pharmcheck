import 'promise-polyfill/src/polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

if (process.env.MOCK) {
  require('./mock/index');
}

ReactDOM.render(<App />, document.querySelector('#root'));
