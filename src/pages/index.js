import React from 'react'
import {graphql, Link} from 'gatsby'
import Img from 'gatsby-image'
import Layout from '../components/layout'
import SEO from '../components/seo'
import PostLink from '../components/post-link'
import Bio from '../components/bio'

import styles from './index.module.scss'
import {classes} from '../util/classes'

const IndexPage = ({
                     data: {
                       site,
                       talk,
                       allMarkdownRemark: {edges}
                     }
                   }) => {
  const Posts = edges
    .filter(edge => edge.node.frontmatter.published)
    .slice(0, 3)
    .map(edge => <PostLink className={styles.post} key={edge.node.id} post={edge.node}/>)

  return <Layout>
    <SEO key={'seo'} title={site.siteMetadata.title} keywords={['blog', 'software', 'angular']}/>
    <div className="content-padding">
      <Bio key={'bio'}/>
      <h1>Writing</h1>
      <p className={styles.text}>
        Learning & sharing - two great things combined allowing me to reflect on the way I work. I'll be writing about
        building products, web technologies from vanilla to frameworks like Angular or Spring and anything that fits in
        between.
      </p>
      <div className={styles.posts}>{Posts}</div>
      <div className={styles.cta}>
        <Link to={'posts'} className="btn">Explore Posts</Link>
      </div>
      <h1>Speaking</h1>
      <p className={styles.text}>
        Public speaking allows me to engage directly with ambitious people from the community and grow both my knowledge
        and myself at the same time.
      </p>
      <p className={styles.text}>
        I like when concepts are conveyed visually and you're able to see benefits right away, that's
        why I often include interactivity and live coding.
      </p>
      <div className={styles.talkCta}>
        <div className={styles.talkImg}>
          <Img fluid={talk.childImageSharp.fluid}/>
        </div>
        <Link to={'talks'} className={classes(styles.talkBtn, 'btn')}>Explore Talks</Link>
      </div>
      <h1>Projects</h1>
      <h1>Consulting</h1>
    </div>
  </Layout>
}

export default IndexPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    talk: file(relativePath: { eq: "talk.jpg" }) {
      childImageSharp {
        fluid(maxWidth: 964, quality: 100) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date] }) {
      edges {
        node {
          id
          excerpt(pruneLength: 250)
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            path
            title
            published
            tags
            banner {
              preview: childImageSharp {
                fluid(maxWidth: 630) {
                  ...GatsbyImageSharpFluid
                }
              }
            }
          }
        }
      }
    }
  }
`
