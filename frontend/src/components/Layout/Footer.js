const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-links">
                    <a href="/privacy-policy">Privacy Policy</a>
                    <span className="divider">•</span>
                    <a href="/terms">Terms & Conditions</a>
                </div>
                <div className="footer-copyright">
                    © {new Date().getFullYear()} Almas. All rights reserved.
                </div>
            </div>

            <style jsx>{`
                .footer {
                    background: white;
                    border-top: 1px solid #eaeaea;
                    padding: 1.5rem 0;
                    width: 100%;
                }

                .footer-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }

                .footer-links {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .footer-links a {
                    color: #666;
                    text-decoration: none;
                    font-size: 0.9rem;
                    transition: color 0.2s ease;
                }

                .footer-links a:hover {
                    color: #fa8072;
                }

                .divider {
                    color: #666;
                }

                .footer-copyright {
                    color: #999;
                    font-size: 0.8rem;
                }
            `}</style>
        </footer>
    );
};

export default Footer; 