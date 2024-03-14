"use client"

import axios from "axios";
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';

export function IsaacGarage() {
  return <Button variant="primary" onClick={() => garage("isaac")}>Isaac Garage</Button>;
}

export function KathrynGarage() {
    return <Button variant="primary" onClick={() => garage("kathryn")}>Kathryn Garage</Button>;
  }

export

function garage(whose) {
    axios.get('https://api.ray-hefner.com/'+whose)
      .then((response) => {
        console.log(response.data);
      });
  }