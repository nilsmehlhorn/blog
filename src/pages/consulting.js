import Layout from '../components/layout'
import SEO from '../components/seo'
import Img from 'gatsby-image'
import React from 'react'
import {graphql} from 'gatsby'
import {classes} from '../util/classes'
import Obfuscate from 'react-obfuscate'

import styles from './consulting.module.scss'

const ConsultingPage = ({data: {topics: {edges: topics}}}) => {
  const Topics = topics.map(({node: {id, topic}}) => {
    let Logos = ''
    if (topic.logos) {
      Logos = topic.logos.map(({logo: {img, link}}) => <a href={link}><Img className={styles.logo}
                                                                           fixed={img.img.fixed}/></a>)
    }
    let Points = ''
    if (topic.points) {
      Points = topic.points.map(point => <li>{point}</li>)
    }
    return <div key={id} className={styles.topic}>
      <header className={styles.header}>
        <h2 className={styles.name}>{topic.name}</h2>
        {Logos}
      </header>
      <p className="text">{topic.description}</p>
      <ul>{Points}</ul>
    </div>
  })
  const desc = 'Freelance software consulting with a focus on web technologies like Angular, Spring, Node.js in an' +
    ' agile development process for maintainable software.'
  return <Layout>
    <SEO description={desc} key={'seo'} title={'Consulting'} keywords={['consulting', 'angular', 'javascript', 'nodejs', 'nativescript']}/>
    <div className="content-padding">
      <h1>Consulting & Workshops</h1>
      <p className="text">
        I've got years of experience in developing enterprise projects and a strong focus on delivering value from
        co-founding a <a className="link" href="https://scenelab.io">SaaS startup</a>. Knowing both large projects as
        well as how to build products that sell, I'll help you develop
        user-focused solutions while keeping your pace through maintainability.
      </p>
      <p><Obfuscate className={classes('link', 'text')} email={process.env.CONTACT_MAIL}/></p>
      <Obfuscate element='p' className='text' tel={process.env.CONTACT_TEL}/>
      <p className="text">
        Let's do a workshop or have me join your
        team. I can help you with the following topics:
      </p>
      <section className={styles.topics}>
        {Topics}
      </section>
    </div>
  </Layout>
}
export default ConsultingPage

export const pageQuery = graphql`
  query {
    topics: allTopicsYaml {
      edges {
        node {
          id
          topic {
            name
            description
            points
            logos {
              logo {
                img {
                  img: childImageSharp {
                    fixed(height: 48, quality: 100) {
                      ...GatsbyImageSharpFixed
                    }
                  }
                }
                link
              }
            }
          }
        }
      }
    }
  }
`
