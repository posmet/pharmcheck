import { action, set, observable, computed, reaction, toJS } from 'mobx';
import AbstractStore from '@stores/Abstract';
import RoutingStore from '@stores/Routing';
import {errorHandler, success} from '@utils/Api';
import moment from 'moment';

class ReferenceStore extends AbstractStore {

  constructor(...args) {
    super(...args);
  }

  getIdKey = (table) => {
    let idKey = null;
    switch (table) {
      case 'Ph_Name':
        idKey = 'Ph_ID';
        break;
      case 'G_name':
        idKey = 'Goods_ID';
        break;
    }
    return idKey;
  };

  list = async (table, filter) => {
    const { post } = this;
    const url = `/api/table/${table}`;
    let idKey = this.getIdKey(table);
    try {
      const {body} = await post({url, body: {filter: filter}});
      return body.map(v => {
        v.value = v[idKey];
        v.label = v[table];
        return v;
      });
    } catch(e) {
      errorHandler.call(this, {showToast: true}, e);
    }
  };

}

export default new ReferenceStore();