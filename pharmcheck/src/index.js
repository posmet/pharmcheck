import 'react-app-polyfill/ie9';
import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

if (process.env.MOCK) {
  require('./mock/index');
}

ReactDOM.render(<App />, document.querySelector('#root'));
