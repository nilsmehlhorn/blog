import React from 'react'

import styles from './location.module.scss'
import {MdLocationOn} from 'react-icons/md'

const Location = ({children}) => (
  <span className={styles.location}>
                <MdLocationOn className={styles.locationIcon} size={32}/>
                {children}
              </span>
)

export default Location
