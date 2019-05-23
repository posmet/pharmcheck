import { action, set, observable, computed, reaction, toJS } from 'mobx';
import AbstractStore from '@stores/Abstract';
import RoutingStore from '@stores/Routing';
import {errorHandler, success} from '@utils/Api';
import { createTransformer } from 'mobx-utils';
import moment from 'moment';
import Immutable from 'seamless-immutable';
import uuid from 'uuid/v4';

class ReportStore extends AbstractStore {

  @observable items = [];
  @observable data = [];
  // @observable data = [
  //   {id: 0, Group_Name: 1, Ph_Name: "Аптека1", dat: "121212", G_name: "Сеть", Barcode: 123, Qty: 1, Price: 20, Sm: 200, QtyPos: 2, frontId: uuid()},
  //   {id: 1, Group_Name: 1, Ph_Name: "Аптека1", dat: "121212", G_name: "Сеть", Barcode: 123, Qty: 2, Price: 40, Sm: 200, QtyPos: 2, frontId: uuid()},
  //   {id: 2, Group_Name: 1, Ph_Name: "Аптека2", dat: "131313", G_name: "Сеть", Barcode: 123, Qty: 1, Price: 20, Sm: 200, QtyPos: 2, frontId: uuid()},
  //   {id: 3, Group_Name: 1, Ph_Name: "Аптека2", dat: "121212", G_name: "Сеть", Barcode: 123, Qty: 1, Price: 20, Sm: 200, QtyPos: 2, frontId: uuid()},
  // ];
  @observable requests = [];
  @observable savedReports = [];
  @computed get selected() {
    return this.items.filter(item => item.id == this.routeId)[0];
  }

  @observable saved = this.defaultSaved();

  dataRequestTime = 0;

  @observable routeId = null;

  constructor(...args) {
    super(...args);
  }

  defaultSaved = () => ({
    filter: [],
    fields: [],
    extended: {
      columns: [],
      rows: [],
      values: []
    }
  });

  changeReport = (routeId) => {
    this.routeId = routeId;
    this.data = [];
    this.dataRequestTime = 0;
    this.saved = this.defaultSaved();
  };

  changeFilter = (value) => {
    this.saved.filter = toJS(value);
  };

  changeColumns = (value) => {
    this.saved.fields = toJS(value);
  };

  changeExtended = (extended, fields) => {
    if (!fields) {
      this.saved.extended = toJS(extended);
    } else {
      const obj = {
        fields: toJS(fields),
        extended: toJS(extended),
        filter: this.saved.filter
      };
      this.saved = obj;
    }
  };

  extendColumn = (column) => {
    if (column.fields) {
      column.fields = column.fields.map(item => ({
        ...item,
        title: item.name,
        name: item.key,
        getCellValue: row => row[item.key]
      }));
    }
  };

  list = async () => {
    const { get } = this;
    const url = `/api/reports`;
    try {
      const {body} = await get({url, isGlobal: true});
      this.items = body ? body.map(rp => {
        this.extendColumn(rp);
        return rp;
      }) : [];
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
    const start = new Date().getTime();
    try {
      const res = await post({url, body, isGlobal: true});
      const end = new Date().getTime() - start;
      this.dataRequestTime = end > 0 ? Math.round((end/1000) * 10)/10 : end;
      this.data = res.body ? Immutable(res.body.map((item, i) => {
        item.id = i;
        item.frontId = uuid();
        return item;
      })) : [];
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
      // this.extendColumn(body);
      body.extended = body.extended || {};
      body.extended.rows = body.extended.rows || [];
      body.extended.columns = body.extended.columns || [];
      body.extended.values = body.extended.values || [];
      body.extended.actions = body.extended.actions || [];
      // body.fields = this.selected.fields;
      this.saved = body;
    } catch(e) {
      errorHandler.call(this, {showToast: true}, e);
      if (!e.abort) {
        this.changeColumns(this.selected.fields);
        throw e;
      }
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