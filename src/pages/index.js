import React from 'react'
import { graphql, Link } from 'gatsby'
import Img from 'gatsby-image'

import styles from './index.module.scss'
import { classes } from '../util/classes'
import Project from '../components/project'
import Layout from '../components/layout'
import SEO from '../components/seo'
import PostLink from '../components/post-link'
import Bio from '../components/bio'

const IndexPage = ({ data }) => {
  const {
    site,
    talk,
    book,
    allMarkdownRemark: { edges: posts },
    projects: { edges: projects },
  } = data
  const Posts = posts
    .filter((edge) => edge.node.frontmatter.published)
    .slice(0, 3)
    .map((edge) => (
      <PostLink className={styles.post} key={edge.node.id} post={edge.node} />
    ))
  const Projects = projects.map((edge) => (
    <Project
      className={styles.project}
      project={edge.node}
      key={edge.node.id}
    />
  ))

  return (
    <Layout>
      <SEO
        key={'seo'}
        title={site.siteMetadata.title}
        keywords={['blog', 'software', 'angular']}
      />
      <div className="content-padding">
        <section className={styles.book}>
          <div className={styles.bookImg}>
            <Img fluid={book.childImageSharp.fluid} />
          </div>
          <div className={styles.bookDesc}>
            <h1>Learn NgRx for Angular</h1>
            <p>
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
              nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
              erat, sed diam voluptua. At vero eos et accusam et justo duo
              dolores et ea rebum. Stet clita kasd gubergren, no sea takimata
              sanctus est Lorem ipsum dolor sit amet.
            </p>
            <a class="btn" href="https://gumroad.com/l/ngrx-book">
              Get the Book
            </a>
          </div>
        </section>
        <Bio className={styles.bio} key={'bio'} />
        <h1>Writing</h1>
        <p className="text">
          Learning & sharing - two great things combined allowing me to reflect
          on the way I work. I'll be writing about building products, web
          technologies from vanilla to frameworks like Angular or Spring and
          anything that fits in between.
        </p>
        <p className="text">
          I'm an author for{' '}
          <a className="link" href="https://medium.com/angular-in-depth">
            Angular In Depth
          </a>{' '}
          and part of the official{' '}
          <a className="link" href="https://dev.to/angular">
            Angular DEV Organization
          </a>
          .
        </p>
        <div className={styles.posts}>{Posts}</div>
        <div className={styles.cta}>
          <Link to={'/posts'} className="btn">
            Explore Posts
          </Link>
        </div>
        <h1>Speaking</h1>
        <p className="text">
          Public speaking allows me to engage directly with ambitious people
          from the community and grow both my knowledge and myself at the same
          time.
        </p>
        <p className="text">
          I like when concepts are conveyed visually and you're able to see
          benefits right away, that's why I often include interactivity and live
          coding.
        </p>
        <div className={styles.talkCta}>
          <div className={styles.talkImg}>
            <Img fluid={talk.childImageSharp.fluid} />
          </div>
          <Link to={'/talks'} className={classes(styles.talkBtn, 'btn')}>
            Explore Talks
          </Link>
        </div>
        <h1>Projects</h1>
        <div className={styles.projects}>{Projects}</div>
      </div>
    </Layout>
  )
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
          ...GatsbyImageSharpFluid_withWebp
        }
      }
    }
    book: file(relativePath: { eq: "book_mockup.jpg" }) {
      childImageSharp {
        fluid(maxHeight: 600, quality: 100) {
          ...GatsbyImageSharpFluid_withWebp
          ...GatsbyImageSharpFluidLimitPresentationSize
        }
      }
    }
    allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date] }) {
      edges {
        node {
          id
          excerpt(pruneLength: 250)
          frontmatter {
            description
            date(formatString: "MMMM DD, YYYY")
            path
            title
            published
            tags
            banner {
              preview: childImageSharp {
                fluid(maxWidth: 630) {
                  ...GatsbyImageSharpFluid_withWebp
                }
              }
            }
          }
        }
      }
    }
    projects: allProjectsYaml {
      edges {
        node {
          id
          project {
            name
            link
            description
            img {
              preview: childImageSharp {
                fluid(maxWidth: 624, quality: 100) {
                  ...GatsbyImageSharpFluid_withWebp
                }
              }
            }
          }
        }
      }
    }
  }
`
