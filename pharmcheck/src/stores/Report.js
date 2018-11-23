import { action, set, observable, computed, reaction, toJS } from 'mobx';
import AbstractStore from '@stores/Abstract';
import RoutingStore from '@stores/Routing';
import {errorHandler, success} from '@utils/Api';
import moment from 'moment';

class ReportStore extends AbstractStore {

  @observable items = [];
  @observable data = [];
  @observable requests = [];
  @observable savedReports = [];
  @computed get selected() {
    return this.items.filter(item => item.id == this.routeId)[0];
  }

  @observable saved = {
    filter: [],
    fields: []
  };

  dataRequestTime = 0;

  @observable routeId = null;

  constructor(...args) {
    super(...args);
  }

  changeReport = (routeId) => {
    this.routeId = routeId;
    this.saved = {
      filter: [],
      fields: []
    };
  };

  changeFilter = (value) => {
    this.saved.filter = toJS(value);
  };

  list = async () => {
    const { get } = this;
    const url = `/api/reports`;
    try {
      const {body} = await get({url, isGlobal: true});
      this.items = body;
    } catch(e) {
      errorHandler.call(this, {showToast: true}, e);
      if (!e.abort) {
        throw e;
      }
    }
  };

  getReportData = async () => {
    const { post } = this;
    const url = `/api/reports/${this.routeId}`;
    const body = {
      filter: this.saved.filter
    };
    const start = moment();
    try {
      const res = await post({url, body, isGlobal: true});
      this.data = res.body;
      this.dataRequestTime = moment().diff(start, 'seconds');
    } catch(e) {
      errorHandler.call(this, {showToast: true}, e);
      this.dataRequestTime = 0;
    }
  };

  listSavedReports = async () => {
    const { get } = this;
    const url = `/api/savedReports`;
    try {
      const {body} = await get({url, isGlobal: true});
      this.savedReports = body;
    } catch(e) {
      errorHandler.call(this, {showToast: true}, e);
    }
  };

  listRequests = async () => {
    const { get } = this;
    const url = `/api/requests`;
    try {
      const {body} = await get({url, isGlobal: true});
      this.requests = body;
    } catch(e) {
      errorHandler.call(this, {showToast: true}, e);
    }
  };

  getSaved = async (id) => {
    const { get } = this;
    const url = `/api/requests/${id}`;
    try {
      const {body} = await get({url, isGlobal: true});
      if (!body) {
        return RoutingStore.push(`/reports/${this.routeId}`);
      }
      this.saved = body;
    } catch(e) {
      errorHandler.call(this, {showToast: true}, e);
    }
  };

  saveRequest = async (body) => {
    const { post } = this;
    const url = `/api/requests/${this.routeId}`;
    try {
      await post({url, body, isGlobal: true});
      success("Запрос успешно сохранен");
    } catch(e) {
      errorHandler.call(this, {showToast: true}, e);
    }
  };

  saveReport = async (body) => {
    const { post } = this;
    const url = `/api/savedReports/${this.routeId}`;
    try {
      await post({url, body, isGlobal: true});
      success("Отчет успешно сохранен");
    } catch(e) {
      errorHandler.call(this, {showToast: true}, e);
    }
  };

  deleteRequest = async (id) => {
    const url = `/api/requests/${id}`;
    try {
      await this.delete({url, isGlobal: true});
      success("Запрос успешно удален");
      await this.listRequests();
    } catch(e) {
      errorHandler.call(this, {showToast: true}, e);
    }
  };

  deleteSavedReport = async (id) => {
    const url = `/api/savedReports/${id}`;
    try {
      await this.delete({url, isGlobal: true});
      success("Отчет успешно удален");
      await this.listSavedReports();
    } catch(e) {
      errorHandler.call(this, {showToast: true}, e);
    }
  };

}

export default new ReportStore();