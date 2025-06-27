import Image from "next/image";
import styles from "../page.module.css";
import {Strawberries, Sausages, Milk, StringCheese, Pepperoni, Yogurts, BabyBell, GranolaBars, OtherGroceries} from "../buttons";



export default function Groceries() {
  return (
    <main className={styles.main}>
        <div className={styles.buttons}>
        <p>
        < Strawberries />
        </p> 
        <p>
        < Sausages />
        </p>
        <p>
        < StringCheese />
        </p>
        <p>
        < Pepperoni />
        </p>
        <p>
        < Yogurts />
        </p>
        <p>
        < BabyBell />
        </p>
        <p>
        < GranolaBars />
        </p>
        <p>
        < Milk />
        </p>
        <p>
        < OtherGroceries />
        </p>
        
        </div>
    </main>
  );
}


