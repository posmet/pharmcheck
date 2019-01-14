import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { Button } from 'react-bootstrap';

@inject('AppStore')
class Footer extends Component {

  render() {
    return (
      <div className="page__content--footer">
        © 2018-2019 Все права защищены, ООО "ФАРМАСОФТ"
      </div>
    );
  }
}

export default Footer;