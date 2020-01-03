import {Link, graphql, StaticQuery} from 'gatsby'
import React from 'react'
import Img from 'gatsby-image'
import {FaBars} from 'react-icons/fa'

import styles from './header.module.scss'
import {classes} from '../util/classes'

class Header extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      nav: false
    }
  }

  toggleNav() {
    this.setState({nav: !this.state.nav})
  }

  render() {
    const {img} = this.props.data
    const navClasses = this.state.nav ? classes(styles.nav, styles.open) : styles.nav
    const menuClasses = this.state.nav ? classes(styles.menu, styles.open) : styles.menu
    return (
      <header className={styles.header}>
        <div className={styles.content}>
          <Link to="/">
            <Img className={styles.logo} fluid={img.childImageSharp.fluid}/>
          </Link>
          <h2 className={styles.heading}>
            <span className={styles.firstname}>Nils&nbsp;</span>
            <span>Mehlhorn</span>
          </h2>
          <button className={menuClasses}>
            <FaBars className={styles.menuIcon} size={32} onClick={() => this.toggleNav()}/>
          </button>
          <nav className={navClasses}>
            <Link className={styles.link} to={'posts'}>Blog</Link>
            <Link className={styles.link} to={'talks'}>Talks</Link>
            <Link className={styles.link} to={'newsletter'}>Mailing List</Link>
            <Link className={styles.link} to={'consulting'}>Work with me</Link>
          </nav>
        </div>
      </header>
    )
  }
}

export default (props) => (
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
      <Header data={data} {...props}/>
    )}
  />
)
