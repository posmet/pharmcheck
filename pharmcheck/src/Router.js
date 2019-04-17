import React, { Component } from 'react';
import { Router, Switch, Route, Redirect } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import { ToastContainer, toast } from 'react-toastify';
import Loader from '@components/common/Loader';
import {createBrowserHistory} from 'history';
import RoutingStore from '@stores/Routing';
import { syncHistoryWithStore } from 'mobx-react-router';
import Secure from '@components/secure/Wrapper';

import Home from '@routes/Home';
import Login from '@routes/Login';
import Report from '@routes/Report';

const browserHistory = createBrowserHistory();
const history = syncHistoryWithStore(browserHistory, RoutingStore);


let loaderAttrs = {
  type: "Ball-Triangle",
  color: "#cef442",
  height: "100",
  width: "100"
};

@inject('AppStore')
@observer
class LoadingWrapper extends Component {
  render() {
    const { props } = this;
    const { AppStore } = props;
    const { loading } = AppStore;
    if (!loading) {
      return null;
    }
    return <Loader {...loaderAttrs} />;
  };
}

@inject('UserStore', 'AppStore', 'ReportStore', 'RoutingStore')
class AppRouter extends Component {

  state = {
    loaded: false
  };

  componentDidMount() {
    const { props } = this;
    const { UserStore, AppStore, RoutingStore, ReportStore } = props;
    const { profile } = UserStore;
    const { token } = AppStore;

    if (token && location.pathname !== '/login') {
      profile()
        .then(() => {
          return ReportStore.list();
        })
        .catch(() => {
          RoutingStore.push('/login');
        })
        .then(() => {
          this.setState({loaded: true});
        })
    } else {
      this.setState({loaded: true});
    }
  };

  get isAuth() {
    return !!this.props.AppStore.token;
  };

  get redirect() {
    const attrs = {
      to: '/login',
      push: true,
    };
    return <Redirect {...attrs} />;
  };

  get router() {
    const { routes, state } = this;
    const { loaded } = state;
    if (!loaded) {
      return null;
    }
    return (
      <Router history={history}>
         { routes }
      </Router>
    );
  };

  get routes() {
    const {redirect} = this;
    return (
      <Switch>
        <Route exact path="/login" component={Login} />
        <Route exact path="*" render={(props) => {
          const {isAuth} = this;
          if (!isAuth) {
            return redirect;
          }
          return (
            <Secure>
              <Switch>
                <Route exact key={props.location.pathname} path="/reports/:id/:savedId" component={Report}/>
                <Route exact key={props.location.pathname} path="/reports/:id" component={Report}/>
                <Route exact key={props.location.pathname} path="/" component={Home}/>
                <Redirect to="/"/>
              </Switch>
            </Secure>
          );
        }}/>
      </Switch>
    );
  };

  render() {
    const { router } = this;

    return (
      <div>
        { router }
        <ToastContainer
          hideProgressBar
          autoClose={5000}
          closeOnClick
          pauseOnHover
          pauseOnVisibilityChange
          draggable
        />
        <LoadingWrapper />
      </div>
    );
  };
}

export default AppRouter;
