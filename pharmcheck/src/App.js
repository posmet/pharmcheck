import React, { Component } from 'react';
import { hot } from 'react-hot-loader';
import { Provider } from 'mobx-react';
import AppRouter from './Router';
import UserStore from '@stores/User';
import AppStore from '@stores/App';
import RoutingStore from '@stores/Routing';
import ReportStore from '@stores/Report';
import moment from 'moment';

// import 'react-datepicker/dist/react-datepicker.css';
// import 'react-contexify/dist/ReactContexify.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '@styles/main.scss';

const DATA = {
  UserStore,
  AppStore,
  RoutingStore,
  ReportStore,
};

moment.locale('ru');

class App extends Component {

  get app() {
    return <AppRouter />;
  }

  geo = () => {
    if ('geolocation' in navigator) {
      console.log('GEO ON');

      navigator.geolocation.getCurrentPosition(function(position) {
        console.log(position, position.coords.latitude, position.coords.longitude);
      });
    } else {
      console.log('GEO OFF');
    }
  };

  render() {
    const { app } = this;

    return (
      <Provider {...DATA}>
        { app }
      </Provider>
    );
  }
}

const hotApp = process.env.NODE_ENV !== 'production' ? hot(module)(App) : App;

export default hotApp;