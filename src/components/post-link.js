import React from 'react'
import {Link} from 'gatsby'
import Tags from './tags'
import styles from './post-link.module.scss'
import Img from 'gatsby-image'
import {classes} from '../util/classes'

const PostLink = ({post, className}) => {
  let banner = ''
  if (post.frontmatter.banner) {
    banner = <Link to={post.frontmatter.path}>
      <Img className={styles.banner} fluid={post.frontmatter.banner.preview.fluid}/>
    </Link>
  }
  return <div className={classes(styles.wrapper, className)}>
    {banner}
    <div className={styles.innerWrapper}>
      <h2 className={styles.title}>
        <Link className={styles.headlineLink} to={post.frontmatter.path}>{post.frontmatter.title}</Link>
      </h2>
      <p className={styles.subtitle}>{post.frontmatter.date}</p>
      <p className={styles.excerpt}><Link to={post.frontmatter.path}>{post.excerpt}</Link></p>
      <Tags className={styles.tags} tags={post.frontmatter.tags}/>
    </div>
  </div>
}

export default PostLink
