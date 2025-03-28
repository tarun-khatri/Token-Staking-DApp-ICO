import React from "react";
import {
  TiSocialTwitter,
  TiSocialFacebook,
  TiSocialLinkedin
} from "react-icons/ti"

const Footer = () => {
  const social = [
    {
      link: "#",
      icon: <TiSocialTwitter/>
    },
    {
      link: "#",
      icon: <TiSocialFacebook/>
    },
    {
      link: "#",
      icon: <TiSocialLinkedin/>
    }
  ]

  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          {/* Logo and Tagline Section */}
          <div className="col-12 col-sm-8 col-md-6 col-lg-6 col-xl-4 order-1 order-lg-4 order-xl-1">
            <div className="footer__logo">
              <img src="img/logo.svg" alt="logo" />
            </div>
            <p className="footer__tagline">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nobis minus, aliquid odio optio ea rem iste illum voluptate quam, omnis ex soluta vel incidunt vero aperiam culpa iure distinctio quidem!
            </p>
          </div>

          {/* Company Section */}
          <div className="col-6 col-md-4 col-lg-3 col-xl-2 order-3 order-md-2 order-lg-2 order-xl-3">
            <h6 className="footer__title">Company</h6>
            <div className="footer__nav">
              <a href="#">About us</a>
              <a href="#">Our news</a>
              <a href="#">License</a>
              <a href="#">Contact Us</a>
            </div>
          </div>

          {/* Services Section */}
          <div className="col-12 col-md-8 col-lg-6 col-xl-4 order-2 order-md-3 order-lg-1 order-xl-2">
            <div className="row">
              <div className="col-12">
                <h6 className="footer__title">Services &amp; Features</h6>
              </div>
              <div className="col-6">
                <div className="footer__nav">
                  <a href="#">Invest</a>
                  <a href="#">Token</a>
                  <a href="#">Affiliate</a>
                  <a href="#">Contest</a>
                </div>
              </div>
              <div className="col-6">
                <div className="footer__nav">
                  <a href="#">Safety</a>
                  <a href="#">Automatixation</a>
                  <a href="#">Analytics</a>
                  <a href="#">Report</a>
                </div>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="col-6 col-md-4 col-lg-3 col-xl-2 order-4">
            <h6 className="footer__title">Support</h6>
            <div className="footer__nav">
              <a href="#">Help Center</a>
              <a href="#">How it works</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms &amp; conditions</a>
            </div>
          </div>
        </div>

        {/* Social and Copyright Section */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="footer__content">
              <div className="footer__social">
                {social.map((item, index) => (
                  <a key={index} href={item.link} target="_blank" rel="noopener noreferrer">
                    <i className="ti">{item.icon}</i>
                  </a>
                ))}
              </div>
              <small className="footer__copyright">
                @Centure, 2025, Created by <a href="#" target="_blank" rel="noopener noreferrer">Tarun Khatri</a>
              </small>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
