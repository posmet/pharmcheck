import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import classnames from 'classnames';
import { Link } from 'react-router-dom';
import {Collapse} from 'react-bootstrap';
import ErrorBoundary from '@components/common/ErrorBoundary';

@inject('UserStore', 'AppStore', 'ReportStore', 'RoutingStore')
@observer
class Sidebar extends Component {

  constructor(props) {
    super(props);
    this.state = {
      menuReportIsOpen: /^\/reports\//i.test(this.props.RoutingStore.location.pathname)
    };
  }

  componentWillMount() {
    this.props.ReportStore.list();
  }

  logout = () => {
    this.props.AppStore.removeToken();
  };

  toggleMenu = (type) => {
    this.setState({[type]: !this.state[type]});
  };

  render() {
    const { props, state, toggleMenu } = this;
    const { menuReportIsOpen } = state;
    const { UserStore, AppStore, ReportStore, RoutingStore } = props;
    const { currentUser } = UserStore;
    const { username } = currentUser;
    const { sidebar } = AppStore;
    const { items, loading } = ReportStore;

    const classes = classnames(
      'sidebar',
      `sidebar--${sidebar}`
    );

    return (
      <ErrorBoundary>
        <nav className={classes}>
          <div className="sidebar-header">
            <h3>{username}</h3>
          </div>

          <ul className="list-unstyled components">
            <li className={RoutingStore.location.pathname === '/' ? 'active' : ''}>
              <Link to='/'>Личный кабинет</Link>
            </li>
            <li>
              <a href="javascript:void(0)" onClick={toggleMenu.bind(this, 'menuReportIsOpen')} data-toggle="collapse" className="dropdown-toggle">Отчеты</a>
              <Collapse in={menuReportIsOpen}>
                <ul className="list-unstyled">
                  { items.map(request => {
                    const path = `/reports/${request.id}`;
                    return (
                      <li key={request.id} className={RoutingStore.location.pathname === path ? 'active' : ''}>
                        <Link to={path}>{request.name}</Link>
                      </li>
                    )
                  }) }
                </ul>
              </Collapse>
            </li>
            <li>
              <a href="javascript:void(0)" onClick={this.logout}>Выйти</a>
            </li>
          </ul>
          <div className="logo" />
        </nav>
      </ErrorBoundary>
    );
  }
}

export default Sidebar;