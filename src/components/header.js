import {Link, graphql, StaticQuery} from 'gatsby'
import PropTypes from 'prop-types'
import React from 'react'
import Img from 'gatsby-image'

import styles from './header.module.scss'

const Header = ({siteTitle}) => (
  <StaticQuery
    query={graphql`
      query HeadingQuery {
        img: file(relativePath: { eq: "logo.png" }) {
          childImageSharp {
            fluid(maxWidth: 92) {
              ...GatsbyImageSharpFluid
            }
          }
        }
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
    render={data => (
      <header className={styles.header}>
        <div className={styles.content}>
          <Link to="/">
            <Img className={styles.logo} fluid={data.img.childImageSharp.fluid}/>
          </Link>
          <div className={styles.pageHeadingWrapper}>
            <h2 className={styles.heading}>
              <span className={styles.firstname}>Nils&nbsp;</span>
              <span>Mehlhorn</span>
            </h2>
          </div>
          <nav className={styles.nav}>
            <Link to={'posts'}>Blog</Link>
            <Link to={'posts'}>Talks</Link>
            <Link to={'posts'}>Workshops</Link>
            <Link to={'posts'}>Consulting</Link>
          </nav>
        </div>
      </header>
    )}
  />
)

Header.propTypes = {
  siteTitle: PropTypes.string
}

Header.defaultProps = {
  siteTitle: ''
}

export default Header
