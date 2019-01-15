import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import classnames from 'classnames';
import { Link } from 'react-router-dom';
import {Collapse, OverlayTrigger, Tooltip} from 'react-bootstrap';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faPowerOff, faDollarSign, faStar } from '@fortawesome/free-solid-svg-icons';

class SidebarLink extends Component {
  render() {
    const {path, icon, name, sidebar} = this.props;
    const tooltip = (
      <Tooltip id="tooltip">
        {name}
      </Tooltip>
    );
    const link = (
      <Link to={path}>
        <span>{name}</span>
        <FontAwesomeIcon icon={icon} />
      </Link>
    );
    if (sidebar === 'sm') {
      return (
        <OverlayTrigger placement="right" overlay={tooltip}>
          { link }
        </OverlayTrigger>
      );
    }
    return link;
  }
}

@inject('UserStore', 'AppStore', 'ReportStore', 'RoutingStore')
@observer
class Sidebar extends Component {

  iconMap = {
    1: faDollarSign,
    2: faStar
  };

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

    const tooltip = (
      <Tooltip id="tooltip">
        <strong>Holy guacamole!</strong> Check this info.
      </Tooltip>
    );

    return (
      <ErrorBoundary>
        <nav className={classes}>
          <div className="sidebar-header">
            <h3>{username}</h3>
          </div>

          <ul className="list-unstyled components">
            <li className={RoutingStore.location.pathname === '/' ? 'active' : ''}>
              <SidebarLink path={'/'} name="Личный кабинет" icon={faHome} sidebar={sidebar} />
            </li>
            <li>
              <span>
                <a href="javascript:void(0)" onClick={toggleMenu.bind(this, 'menuReportIsOpen')} data-toggle="collapse" className="dropdown-toggle">Отчеты</a>
              </span>
              <Collapse in={menuReportIsOpen || sidebar === 'sm'}>
                <ul className="list-unstyled">
                  { items.map(request => {
                    const path = `/reports/${request.id}`;
                    return (
                      <li key={request.id} className={RoutingStore.location.pathname === path ? 'active' : ''}>
                        <SidebarLink path={path} name={request.name} icon={this.iconMap[request.id]} sidebar={sidebar} />
                      </li>
                    )
                  }) }
                </ul>
              </Collapse>
            </li>
            <li>
              <SidebarLink path={'/login'} name="Выйти" icon={faPowerOff} sidebar={sidebar} />
            </li>
          </ul>
          <div className="logo" />
        </nav>
      </ErrorBoundary>
    );
  }
}

export default Sidebar;