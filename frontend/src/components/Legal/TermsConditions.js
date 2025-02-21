const TermsConditions = () => {
    return (
        <div className="legal-container">
            <h1>Terms and Conditions</h1>
            <div className="content">
                <p className="last-updated">Last Updated: 21.02.2025</p>

                <p className="intro">
                    Welcome to Almas Platforms! These Terms and Conditions ("Terms") govern your access and use of the Almas Platforms website and services (collectively, the "Platform"). By creating an account or using any part of the Platform, you agree to abide by these Terms. If you do not agree, please do not use the Platform.
                </p>

                <section>
                    <h2>1. Eligibility</h2>
                    <ul>
                        <li>You must be at least <strong>16 years old</strong> to use the Platform.</li>
                        <li>By creating an account, you confirm that all information you provide is <strong>accurate, complete, and up to date</strong>.</li>
                        <li>You must not have been previously banned from the Platform.</li>
                    </ul>
                </section>

                <section>
                    <h2>2. User Accounts</h2>
                    <ul>
                        <li>To access the full features of Almas Platforms, you must create an account by providing a <strong>name, email, profile name, and profile picture</strong>.</li>
                        <li>You are responsible for maintaining the <strong>security of your account</strong> and must not share your login credentials.</li>
                        <li>If you suspect unauthorized access to your account, notify us immediately.</li>
                    </ul>
                </section>

                <section>
                    <h2>3. User-Generated Content</h2>
                    <p>Users can post <em>images, products, curated links, music, announcements, chats, polls, questions, and contributions</em> in communities. By posting, you agree:</p>
                    <ul>
                        <li>You <strong>own or have rights</strong> to share any content you upload.</li>
                        <li>Your content must <strong>not violate any laws</strong> or contain hate speech, harassment, explicit content, or false information.</li>
                        <li>The Platform reserves the right to <strong>remove or moderate</strong> any content that violates these Terms.</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Community Access & Privacy</h2>
                    <ul>
                        <li>All content is public, but only logged-in users can view community feeds.</li>
                        <li>Users can join and create theme-based communities.</li>
                        <li>We do not offer private communities at this time.</li>
                    </ul>
                </section>

                <section>
                    <h2>5. Monetization & Advertising</h2>
                    <ul>
                        <li>The Platform displays ads, which help support its services.</li>
                        <li>Affiliate marketing may be introduced in the future.</li>
                        <li>We are not responsible for third-party ads shown on the Platform.</li>
                    </ul>
                </section>

                <section>
                    <h2>6. Account Termination</h2>
                    <ul>
                        <li>Users can <strong>delete their own accounts</strong> at any time via account settings.</li>
                        <li>We reserve the right to <strong>suspend or terminate</strong> accounts that violate our Terms.</li>
                    </ul>
                </section>

                <section>
                    <h2>7. Limitations of Liability</h2>
                    <ul>
                        <li>The Platform is provided <strong>as-is</strong> without warranties of any kind.</li>
                        <li>We are not responsible for any <strong>content, user interactions, or damages</strong> caused by the use of the Platform.</li>
                    </ul>
                </section>

                <section>
                    <h2>8. Governing Law</h2>
                    <ul>
                        <li>These Terms are governed by <strong>EU law</strong>.</li>
                        <li>Any legal disputes must be settled in courts within the <strong>EU jurisdiction</strong>.</li>
                    </ul>
                </section>

                <section>
                    <h2>9. Changes to These Terms</h2>
                    <ul>
                        <li>We may update these Terms from time to time. Users will be notified of significant changes.</li>
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
            `}</style>
        </div>
    );
};

export default TermsConditions; 