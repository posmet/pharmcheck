import { action, set, observable, computed } from 'mobx';
import AbstractStore from '@stores/Abstract';
import RoutingStore from '@stores/Routing';
import {errorHandler} from '@utils/Api';

class UserStore extends AbstractStore {

  @observable currentUser = null;
  @observable items = [];

  constructor(...args) {
    super(...args);
  }

  profile = async () => {
    const { get } = this;
    const url = `/api/profile`;
    try {
      const {body} = await get({url, isGlobal: true});
      this.currentUser = body;
    } catch (e) {
      errorHandler.call(this, {showToast: true}, e);
      if (!e.abort) {
        RoutingStore.push('/login');
        throw e;
      }
    }
  };

  login = async (body) => {
    const { post } = this;
    const url = `/api/login`;
    try {
      const res = await post({url, body, isGlobal: true});
      return Promise.resolve(res);
    } catch (e) {
      errorHandler.call(this, {showToast: true}, e);
      throw e;
    }
  };

}

export default new UserStore();