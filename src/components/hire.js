import React from 'react'

import styles from './hire.module.scss'
import {FaUserFriends} from 'react-icons/fa'
import { Link } from 'gatsby'

const Hire = () => (
    <div className={styles.hire}>
        <FaUserFriends size={32} className={styles.hireIcon}/>
        <p className={styles.hireText}>
            I hope this article helped you with your project. <Link className={styles.hireLink} to={'/consulting'}>Hire me</Link>, if you need further support solving your specific problem. Sometimes even just a quick code review or second opinion can make a great difference.   
        </p>
    </div>
)

export default Hire