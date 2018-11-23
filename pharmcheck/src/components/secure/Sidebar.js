import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import classnames from 'classnames';
import { Link } from 'react-router-dom';

@inject('UserStore', 'AppStore', 'ReportStore', 'RoutingStore')
@observer
class Sidebar extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  logout = () => {
    this.props.AppStore.removeToken();
  };

  toggleMenu = (e) => {
    const node = e.target.parentNode;
    if (node.classList.contains('expand')) {
      node.classList.remove("expand");
    } else {
      node.classList.add("expand");
    }
  };

  render() {
    const { props } = this;
    const { UserStore, AppStore, ReportStore, RoutingStore } = props;
    const { currentUser } = UserStore;
    const { name } = currentUser;
    const { sidebar } = AppStore;
    const { items, loading } = ReportStore;

    const classes = classnames(
      'sidebar',
      `sidebar--${sidebar}`
    );

    return (
      <nav className={classes}>
        <div className="sidebar-header">
          <h3>{name}</h3>
        </div>

        <ul className="list-unstyled components">
          <li className={RoutingStore.location.pathname === '/' ? 'active' : ''}>
            <Link to='/'>Личный кабинет</Link>
          </li>
          <li>
            <a href="javascript:void(0)" onClick={this.toggleMenu} data-toggle="collapse" className="dropdown-toggle">Отчеты</a>
            <ul className="collapse list-unstyled">
              { items.map(request => {
                const path = `/reports/${request.id}`;
                return (
                  <li key={request.id} className={RoutingStore.location.pathname === path ? 'active' : ''}>
                    <Link to={path}>{request.name}</Link>
                  </li>
                )
              }) }
            </ul>
          </li>
          <li>
            <a href="javascript:void(0)" onClick={this.logout}>Выйти</a>
          </li>
        </ul>
      </nav>
    );
  }
}

export default Sidebar;