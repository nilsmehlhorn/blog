import React from 'react'
import { graphql } from 'gatsby'
import Img from 'gatsby-image'
import Layout from '../components/layout'
import Tags from '../components/tags'
import SEO from '../components/seo'
import Bio from '../components/bio'
import Hire from '../components/hire'

import styles from './post-template.module.scss'
import RelatedPosts from '../components/related-posts'
import Comments from '../components/comments'
import Sharing from '../components/sharing'

export default function Template({ data }) {
  const {
    markdownRemark,
    relatedPosts,
    site: { siteMetadata },
  } = data
  const { frontmatter, html, excerpt } = markdownRemark
  const url = `${siteMetadata.siteUrl}${frontmatter.path}`
  const description = frontmatter.description || excerpt
  let banner = ''
  let previewImage
  if (frontmatter.banner) {
    banner = <Img fluid={frontmatter.banner.full.fluid} />
    previewImage = frontmatter.banner.preview.fluid.src
  }
  let update
  if (frontmatter.formattedUpdate) {
    update = (
      <p className={styles.update}>Updated on {frontmatter.formattedUpdate}</p>
    )
  }
  const meta = [
    { name: 'date', content: frontmatter.update || frontmatter.date },
  ]
  return (
    <Layout>
      <SEO
        previewImage={previewImage}
        keywords={[...frontmatter.tags, ...(frontmatter.keywords ?? [])]}
        title={frontmatter.title}
        description={description}
        meta={meta}
      />
      {banner}
      <div className={styles.content}>
        <div className={styles.postWrapper}>
          <h1 className={styles.heading}>{frontmatter.title}</h1>
          <div className={styles.sub}>
            <p className={styles.date}>{frontmatter.formattedDate}</p>
            <Tags className={styles.tags} tags={frontmatter.tags} />
            {update}
          </div>
          <div
            className={styles.postContent}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
        <Hire />
        <Sharing title={frontmatter.title} url={url} />
        <Bio short={true} />
        <Comments id={frontmatter.path} />
        <RelatedPosts posts={relatedPosts.nodes} />
      </div>
    </Layout>
  )
}

export const pageQuery = graphql`
  query($path: String!, $relatedPosts: [String!]!) {
    site {
      siteMetadata {
        siteUrl
      }
    }
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      excerpt(pruneLength: 250)
      frontmatter {
        formattedDate: date(formatString: "MMMM DD, YYYY")
        formattedUpdate: update(formatString: "MMMM DD, YYYY")
        date
        update
        path
        title
        tags
        keywords
        description
        banner {
          full: childImageSharp {
            fluid(maxWidth: 960, maxHeight: 400, quality: 100) {
              ...GatsbyImageSharpFluid_withWebp
            }
          }
          preview: childImageSharp {
            fluid(maxWidth: 630) {
              ...GatsbyImageSharpFluid_withWebp
            }
          }
        }
      }
    }
    relatedPosts: allMarkdownRemark(
      filter: { frontmatter: { path: { in: $relatedPosts } } }
    ) {
      nodes {
        id
        excerpt(pruneLength: 250)
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          path
          title
          tags
          description
          banner {
            preview: childImageSharp {
              fluid(maxWidth: 630, maxHeight: 250, cropFocus: CENTER) {
                ...GatsbyImageSharpFluid_withWebp
              }
            }
          }
        }
      }
    }
  }
`
