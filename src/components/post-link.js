import React from "react"
import {Link} from "gatsby"
import Tags from "./tags"

import styles from "./post-link.module.scss"

const PostLink = ({post}) => (
  <div>
    <Link className={styles.headlineLink} to={post.frontmatter.path}>
      <h2 className={styles.thumbTitle}>{post.frontmatter.title}</h2>
    </Link>
    <p className={styles.thumbSub}>{post.frontmatter.date}</p>
    <Tags tags={post.frontmatter.tags}/>
    <p>{post.excerpt} <Link to={post.frontmatter.path}>more</Link></p>
  </div>
)

export default PostLink
