"use client"

import axios from "axios";
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';

export function IsaacGarage() {
  return <Button variant="danger" onClick={() => garage("isaac")}>Isaac Garage</Button>;
}

export function KathrynGarage() {
    return <Button variant="danger" onClick={() => garage("kathryn")}>Kathryn Garage</Button>;
  }

export function FamilyRoomLight() {
    return <Button variant="primary" onClick={() => webhook("family_room_light")}>Family Room Light</Button>;
  }

  export function ColtonStar() {
    return <Button variant="success" onClick={() => webhook("colton_star")}>Colton + </Button>;
  }
  export function ColtonDemerit() {
    return <Button variant="warning" onClick={() => webhook("colton_demerit")}>Colton - </Button>;
  }



function garage(whose) {
    axios.get('https://api.ray-hefner.com/'+whose)
      .then((response) => {
        console.log(response.data);
      });
  }


  function webhook(event){
    axios.get('https://maker.ifttt.com/trigger/'+event+'/with/key/c_0ufFFhyJW6OHzYqgzwP4')
      .then((response) => {
        console.log(response.data);
      });
  }