import React from 'react'
import {Link} from 'gatsby'
import Tags from './tags'

import styles from './post-link.module.scss'
import Img from 'gatsby-image'

const PostLink = ({post}) => {
  let banner = ''
  if (post.frontmatter.banner) {
    banner = <Img fluid={post.frontmatter.banner.previewImg.fluid}/>
  }
  return <div><div className={styles.wrapper}>
    {banner}
    <div className={styles.innerWrapper}>
      <h2 className={styles.title}>
        <Link className={styles.headlineLink} to={post.frontmatter.path}>{post.frontmatter.title}</Link>
      </h2>
      <p className={styles.subtitle}>{post.frontmatter.date}</p>
      <p className={styles.excerpt}><Link to={post.frontmatter.path}>{post.excerpt}</Link></p>
      <Tags tags={post.frontmatter.tags}/>
    </div>
  </div></div>
}

export default PostLink
