import React, { Component } from 'react';
import {Card, Collapse, Button, ButtonToolbar, Tabs, Tab} from 'react-bootstrap';
import { observer, inject } from 'mobx-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { SettingsModal, RequestModal, SaveModal } from "@components/report/Modals";
import { Filter } from "@components/report/Filter";
import { DefaultTable, ExtendedTable } from "@components/report/Tables";
import uuid from 'uuid/v4';


@inject('AppStore', 'ReportStore', 'RoutingStore')
@observer
class Report extends Component {

  state = {
    showFilter: false,
    tableView: 'extended',
    settingsModal: false,
    requestModal: false,
    saveModal: false
  };

  componentWillMount() {
    const {ReportStore, match} = this.props;
    ReportStore.changeReport(match.params.id);
  }

  componentDidMount() {
    const {ReportStore, RoutingStore, match} = this.props;
    if (!ReportStore.selected) {
      RoutingStore.push('/');
    }
    const { savedId } = match.params;
    if (savedId) {
      this.setState({showFilter: true});
      ReportStore.getSaved(savedId)
        .then(() => {
          ReportStore.getReportData();
        })
    } else {
      ReportStore.changeColumns(ReportStore.selected.fields);
      // ReportStore.getReportData();
    }
  }

  onRefresh = () => {
    this.props.ReportStore.getReportData();
  };

  onSubmitSettings = (v) => {
    const { props, toggleModal } = this;
    const { saved } = props.ReportStore;
    saved.fields = v;
    toggleModal('settingsModal', null);
  };

  onSubmitRequest = (v) => {
    const { props, toggleModal } = this;
    const { selected, saved, saveRequest } = props.ReportStore;
    saveRequest({...v, filter: saved.filter, fields: !saved.fields.length ? selected.fields : saved.fields, extended: saved.extended});
    toggleModal('requestModal', null);
  };

  onSubmitReport = (v) => {
    const { props, toggleModal } = this;
    const { selected, saved, saveReport } = props.ReportStore;
    saveReport({...v, filter: saved.filter, fields: !saved.fields.length ? selected.fields : saved.fields, extended: saved.extended});
    toggleModal('saveModal', null);
  };

  onFilterChange = (v) => {
    this.props.ReportStore.changeFilter(v);
  };

  onTableChange = (v) => {
    this.props.ReportStore.changeColumns(v);
  };

  onExtendedTableChange = (extended, columns) => {
    this.props.ReportStore.changeExtended(extended, columns);
  };

  onSelectView = (tableView) => {
    this.setState({tableView});
  };

  toggleModal = (key, value) => {
    this.setState({[key]: value});
  };

  render() {
    const { props, state, toggleModal, onSubmitSettings, onSubmitRequest, onSubmitReport, onRefresh } = this;
    const { ReportStore } = props;
    const { showFilter, settingsModal, requestModal, saveModal } = state;
    const { selected, saved, data, dataRequestTime } = ReportStore;

    return (
      <Card>
        <Card.Header>{selected.description}</Card.Header>
        <Card.Body>
          <Button variant="link" onClick={() => this.setState({showFilter: !showFilter})}>
            <FontAwesomeIcon icon={faAngleRight} /> Фильтр
          </Button>
          <Collapse in={showFilter}>
            <div>
              <Filter from={selected.fields} to={saved.filter} onChange={this.onFilterChange} />
            </div>
          </Collapse>
          <div className="report-data">
            <div className="report-data__header">
              <div className="report-data__header--info">Найдено {data.length} позиций, поиск занял {dataRequestTime || 0} сек.</div>
              <ButtonToolbar className="report-data__header--buttons">
                <Button variant="outline-success" onClick={onRefresh}>Обновить</Button>
                <Button variant="outline-success" onClick={toggleModal.bind(this, 'requestModal', true)}>Сохранить</Button>
                <Button variant="outline-success" onClick={toggleModal.bind(this, 'saveModal', true)}>Создать отчет</Button>
                {/*<Button variant="outline-success" onClick={toggleModal.bind(this, 'settingsModal', true)}>Настройки таблицы</Button>*/}
              </ButtonToolbar>
            </div>
            <div className="report-data__body">
              {/*<ReactDataGrid
                columns={fields.map(item => {
                  let obj = Object.assign({}, item);
                  obj.width = 10;
                  return item;
                })}
                rowGetter={i => data[i]}
                rowsCount={data.length}
                minHeight={data.length > 8 ? 350 : data.length * 35}
              />*/}
              {/*<TestTable/>*/}
              {state.tableView === 'default' ? (
                <DefaultTable
                  rows={data}
                  columns={saved.fields}
                  onChange={this.onTableChange}
                />
              ) : (
                <ExtendedTable
                  rows={data}
                  columns={saved.fields}
                  extended={saved.extended}
                  onChange={this.onExtendedTableChange}
                />
              )}
              <Tabs
                activeKey={state.tableView}
                onSelect={this.onSelectView}
              >
                <Tab eventKey="default" title="Таблица" />
                <Tab eventKey="extended" title="Расширенная таблица" />
              </Tabs>

            </div>
          </div>

          {/*<SettingsModal show={settingsModal} fields={selected.fields} saved={saved.fields} onSubmit={onSubmitSettings} onCancel={toggleModal.bind(this, 'settingsModal', false)} />*/}
          <RequestModal show={requestModal} onCancel={toggleModal.bind(this, 'requestModal', false)} onSubmit={onSubmitRequest} />
          <SaveModal show={saveModal} onCancel={toggleModal.bind(this, 'saveModal', false)} onSubmit={onSubmitReport} />
        </Card.Body>
      </Card>
    );
  }
}

export default Report;