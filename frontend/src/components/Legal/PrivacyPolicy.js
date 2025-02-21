const PrivacyPolicy = () => {
    return (
        <div className="legal-container">
            <h1>Privacy Policy</h1>
            <div className="content">
                <p className="last-updated">Last Updated: 21.02.25</p>

                <p className="intro">
                    At Almas Platforms, we value your privacy. This Privacy Policy explains how we collect,
                    use, and protect your information.
                </p>

                <section>
                    <h2>1. Data We Collect</h2>
                    <p>We collect the following information when you register:</p>
                    <ul>
                        <li>Name, email, profile name, profile picture, and activity data.</li>
                    </ul>
                </section>

                <section>
                    <h2>2. How We Use Your Data</h2>
                    <p>We use your data to:</p>
                    <ul>
                        <li>Enable account creation and login.</li>
                        <li>Allow community participation (posting images, links, questions, etc.).</li>
                        <li>Improve the Platform and personalize user experiences.</li>
                        <li>Display relevant ads.</li>
                    </ul>
                </section>

                <section>
                    <h2>3. Public & Private Information</h2>
                    <ul>
                        <li><strong>Public:</strong> Your profile name and uploaded content are visible to all users.</li>
                        <li><strong>Private:</strong> Your email is <em>never</em> shared publicly.</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Cookies & Tracking</h2>
                    <ul>
                        <li>We use cookies to improve user experience and display targeted ads.</li>
                        <li>You can adjust cookie settings in your browser.</li>
                    </ul>
                </section>

                <section>
                    <h2>5. Data Security</h2>
                    <p>
                        We implement security measures to protect your data but <strong>cannot guarantee 100%
                        security</strong>.
                    </p>
                </section>

                <section>
                    <h2>6. Third-Party Services</h2>
                    <ul>
                        <li>Ads and affiliate links may be provided by third-party networks.</li>
                        <li>We are not responsible for third-party services or their data policies.</li>
                    </ul>
                </section>

                <section>
                    <h2>7. Your Rights</h2>
                    <p>Under EU laws, you have the right to:</p>
                    <ul>
                        <li>Access, update, or delete your data.</li>
                        <li>Request that we stop using your data for marketing.</li>
                        <li>Delete your account at any time.</li>
                    </ul>
                </section>

                <section>
                    <h2>8. Data Storage & Retention</h2>
                    <ul>
                        <li>We store user data on secure servers and retain it as long as necessary for platform operations.</li>
                        <li>Deleted accounts have their data removed within 60 days.</li>
                    </ul>
                </section>

                <section>
                    <h2>9. Changes to This Policy</h2>
                    <ul>
                        <li>We may update this Privacy Policy and will notify users of major changes.</li>
                    </ul>
                </section>

                <p className="contact">
                    For any privacy-related concerns, contact us at <a href="mailto:almasplatforms@gmail.com">almasplatforms@gmail.com</a>
                </p>
            </div>

            <style jsx>{`
                .legal-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .content {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    line-height: 1.6;
                }

                h1 {
                    margin-bottom: 1rem;
                    color: #333;
                }

                h2 {
                    color: #444;
                    margin: 1.5rem 0 1rem;
                    font-size: 1.25rem;
                }

                .last-updated {
                    color: #666;
                    font-size: 0.9rem;
                    margin-bottom: 1.5rem;
                }

                .intro {
                    margin-bottom: 2rem;
                }

                section {
                    margin-bottom: 2rem;
                }

                ul {
                    margin: 0.5rem 0;
                    padding-left: 1.5rem;
                }

                li {
                    margin: 0.5rem 0;
                }

                strong {
                    font-weight: 600;
                }

                em {
                    font-style: italic;
                }

                .contact {
                    margin-top: 2rem;
                    padding-top: 1rem;
                    border-top: 1px solid #eaeaea;
                }

                .contact a {
                    color: #fa8072;
                    text-decoration: none;
                }

                .contact a:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
};

export default PrivacyPolicy; 