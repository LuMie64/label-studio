// Spinner.jsx
import React from "react";
import styles from "./Styles.module.scss";

const Spinner = () => (
  <div className={styles.loadingSpinner}>
    <div className={styles.spinner}></div>
    <p className={styles.loadingText}>Loading...</p>
  </div>
);

export default Spinner;
