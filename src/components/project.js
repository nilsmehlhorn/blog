import Img from 'gatsby-image'
import React from 'react'
import styles from './project.module.scss'
import {classes} from '../util/classes'

const Project = ({project: {project}, className}) => {
  const {name, img, link, description} = project
  let banner = ''
  if (img) {
    banner = <a href={link}>
      <Img className={styles.banner} fluid={img.preview.fluid}/>
    </a>
  }
  return <div className={classes(styles.wrapper, className)}>
    {banner}
    <div className={styles.innerWrapper}>
      <div className={styles.title}>
        <h2 className={styles.name}>{name}</h2>
        <a href={link} className='btn'>View</a>
      </div>
      <p>{description}</p>
    </div>
  </div>
}

export default Project
