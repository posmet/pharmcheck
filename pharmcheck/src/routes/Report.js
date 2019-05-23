import React, { Component } from 'react';
import {Card, Collapse, Button as BButton, ButtonToolbar, Tabs, Tab} from 'react-bootstrap';
import { observer, inject } from 'mobx-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { SettingsModal, RequestModal, SaveModal } from "@components/report/Modals";
import { Filter } from "@components/report/Filter";
import { DefaultTable, ExtendedTable } from "@components/report/Tables";
import Button from '@material-ui/core/Button';
import uuid from 'uuid/v4';

@inject(stores => {
  return {
    selected: stores.ReportStore.selected,
    saved: stores.ReportStore.saved,
    data: stores.ReportStore.data,
    changeColumns: stores.ReportStore.changeColumns,
    changeExtended: stores.ReportStore.changeExtended,
  };
})
@observer
class TabContent extends Component {
  onTableChange = (v) => {
    this.props.changeColumns(v);
  };

  onExtendedTableChange = (extended, columns) => {
    this.props.changeExtended(extended, columns);
  };
  getButton = (props) => {
    const attrs = {
      key: props.caption
    };
    if (props.href) {
      attrs.href = props.href;
    }
    switch (props.caption) {
      case 'Править':
        attrs.color = "primary";
        break;
      case 'Удалить':
        attrs.color = "secondary";
        break;
    }
    return <Button {...attrs} >{props.caption}</Button>;
  };
  render() {
    if (!this.props.saved.fields.length) {
      return null;
    }
    return this.props.tableView === 'default' ? (
      <React.Fragment>
        {this.props.selected.actions && this.props.selected.actions.length ? this.props.selected.actions.map(v => this.getButton(v)) : null}
        <DefaultTable
          rows={this.props.data}
          columns={this.props.saved.fields}
          onChange={this.onTableChange}
        />
      </React.Fragment>
    ) : (
      <ExtendedTable
        rows={this.props.data}
        columns={this.props.selected.fields}
        extended={this.props.saved.extended}
        onChange={this.onExtendedTableChange}
      />
    )
  }
}


@inject('AppStore', 'ReportStore', 'RoutingStore')
@observer
class Report extends Component {

  state = {
    showFilter: false,
    tableView: 'default',
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
      return false;
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

  get tabContent() {
    if (!this.props.ReportStore.selected.fields.length) {
      return null;
    }
    return this.state.tableView === 'default' ? (
      <DefaultTable
        rows={this.props.ReportStore.data}
        columns={this.props.ReportStore.saved.fields}
        onChange={this.onTableChange}
      />
    ) : (
      <ExtendedTable
        rows={this.props.ReportStore.data}
        columns={this.props.ReportStore.selected.fields}
        extended={this.props.ReportStore.saved.extended}
        onChange={this.onExtendedTableChange}
      />
    )
  }

  render() {
    const { props, state, toggleModal, onSubmitSettings, onSubmitRequest, onSubmitReport, onRefresh } = this;
    const { ReportStore } = props;
    const { showFilter, settingsModal, requestModal, saveModal } = state;
    const { selected, saved, data, dataRequestTime } = ReportStore;

    return (
      <Card>
        <Card.Header>{selected.description}</Card.Header>
        <Card.Body>
          <BButton variant="link" onClick={() => this.setState({showFilter: !showFilter})}>
            <FontAwesomeIcon icon={faAngleRight} /> Фильтр
          </BButton>
          <Collapse in={showFilter}>
            <div>
              <Filter from={selected.fields} to={saved.filter} onChange={this.onFilterChange} />
            </div>
          </Collapse>
          <div className="report-data">
            <div className="report-data__header">
              <div className="report-data__header--info">Найдено {data.length} позиций, поиск занял {dataRequestTime || 0} сек.</div>
              <ButtonToolbar className="report-data__header--buttons">
                <Button variant="outlined" color="primary" onClick={onRefresh}>Обновить</Button>
                <Button variant="outlined" color="primary" onClick={toggleModal.bind(this, 'requestModal', true)}>Сохранить</Button>
                <Button variant="outlined" color="primary" onClick={toggleModal.bind(this, 'saveModal', true)}>Создать отчет</Button>
                {/*<Button variant="outline-success" onClick={toggleModal.bind(this, 'settingsModal', true)}>Настройки таблицы</Button>*/}
              </ButtonToolbar>
            </div>
            <div className="report-data__body">
              {/*{ this.tabContent }*/}
              <TabContent tableView={this.state.tableView} />
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