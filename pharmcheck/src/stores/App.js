import { set, observable, reaction } from 'mobx';
import Cookies from 'universal-cookie';
import RoutingStore from '@stores/Routing';

class AppStore {

  @observable loading = false;
  @observable sidebar = 'lg';
  abortControllers = {

  };
  token = null;

  constructor() {
    const { cookie } = this;
    const token = cookie.get('pharma_token'); //this thing returns 'undefined' string if no token
    this.token = token !== 'undefined' ? token : null;
  }

  get cookie() {
    return new Cookies();
  }

  collapseSidebar  = () => {
    this.sidebar = this.sidebar === 'lg' ? 'sm' : 'lg';
  };

  setToken(token, remember) {
    const { cookie } = this;
    this.token = token;
    if (remember) {
      cookie.set('pharma_token', token);
    }
  }

  removeToken() {
    const { cookie } = this;
    cookie.remove('pharma_token');
    RoutingStore.push('/login');
  }

}

export default new AppStore();

