"use client"

import axios from "axios";
import Button from 'react-bootstrap/Button';

import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from "react";

export function IsaacGarage() {
  return <Button variant="danger" onClick={() => garage("isaac")}>Isaac Garage</Button>;
}

export function KathrynGarage() {
    return <Button variant="danger" onClick={() => garage("kathryn")}>Kathryn Garage</Button>;
  }

export function FamilyRoomLight() {
    return <Button variant="primary" onClick={() => webhook("family_room_light")}>Family Room Light</Button>;
  }

  export function Logging() {
    const [textFieldValue, setTextFieldValue] = useState('');
    return (
    <>
    <input type="text" id="logging" value={textFieldValue} onChange={(e) => setTextFieldValue(e.target.value)}></input>
    <Button variant="info" onClick={() => webhook("logging", `${textFieldValue}`)}>Logging</Button>
    </>
    )
  }

  export function OtherGroceries() {
    const [textFieldValue, setTextFieldValue] = useState('');
    return (
    <>
    <input type="text" id="other" value={textFieldValue} onChange={(e) => setTextFieldValue(e.target.value)}></input>
    <Button variant="info" onClick={() => webhook("groceries", `${textFieldValue}`)}>Other</Button>
    </>
    )
  }

  

  export function Strawberries() {
    return <Button variant="primary" onClick={() => webhook("groceries", "strawberries")}>Strawberries</Button>;
  }

  export function Yogurts() {
    return <Button variant="primary" onClick={() => webhook("groceries", "chobani yogurts")}>Yogurts</Button>;
  }

export function Sausages() { 
  return <Button variant="primary" onClick={() => webhook("groceries", "sausages")}>Sausages</Button>;
} 

export function Pepperoni() {
  return <Button variant="primary" onClick={() => webhook("groceries", "pepperoni")}>Pepperoni</Button>;
}

export function BabyBell() {
  return <Button variant="primary" onClick={() => webhook("groceries", "babybell")}>Baby Bell</Button>;
}

export function StringCheese() {
  return <Button variant="primary" onClick={() => webhook("groceries", "string cheese")}>String Cheese</Button>;
}

export function GranolaBars() {
  return <Button variant="primary" onClick={() => webhook("groceries", "granola bars")}>Granola Bars</Button>;
}

export function Milk() { 
  return <Button variant="primary" onClick={() => webhook("groceries", "milk")}>Milk</Button>;
}





function garage(whose) {
    axios.get('https://api.ray-hefner.com/'+whose)
      .then((response) => {
        alert("Garage button clicked")
      }).catch((error) => { alert("Garage button clicked") });
  }


  function webhook(event, value){
    if (value){
      axios.get('https://maker.ifttt.com/trigger/'+event+'/with/key/c_0ufFFhyJW6OHzYqgzwP4?value1='+value)
      .then((response) => {
        console.log("Button clicked");

      }).catch((error) => { alert("Button clicked") });
    } else {
    axios.get('https://maker.ifttt.com/trigger/'+event+'/with/key/c_0ufFFhyJW6OHzYqgzwP4')
      .then((response) => {
        console.log("Button clicked");
      }).catch((error) => { alert("Button clicked") });
  }
}



  