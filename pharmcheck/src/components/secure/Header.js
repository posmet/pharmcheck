import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { Button } from 'react-bootstrap';

@inject('AppStore')
class Header extends Component {

  render() {
    const { props } = this;
    const { AppStore } = props;

    return (
      <div className="page__content--header">
        <Button onClick={AppStore.collapseSidebar} variant="outline-success" size="sm">
          <FontAwesomeIcon icon={faBars} />
        </Button>
      </div>
    );
  }
}

export default Header;