import Layout from '../components/layout'
import SEO from '../components/seo'
import React from 'react'
import Obfuscate from 'react-obfuscate'

const ImprintPage = () => {
  return <Layout>
    <SEO key={'seo'} title={'Imprint'}/>
    <div className='content-padding'>
      <h1>Imprint</h1>
      <p className='text'>
        <address style={{fontStyle: 'normal'}}>
          Nils Mehlhorn<br/>
          <Obfuscate element='span' obfuscateChildren={true}>{process.env.GATSBY_CONTACT_STREET}</Obfuscate><br/>
          45128 Essen<br/>
          Germany<br/>
          E-Mail: <Obfuscate className='link' email={process.env.GATSBY_CONTACT_MAIL}/><br/>
          Phone: <Obfuscate className='link' tel={process.env.GATSBY_CONTACT_TEL}/><br/>
        </address>
      </p>
    </div>
  </Layout>
}
export default ImprintPage
