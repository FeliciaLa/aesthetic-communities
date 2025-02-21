const PrivacyPolicy = () => {
    return (
        <div className="legal-container">
            <h1>Privacy Policy</h1>
            <div className="content">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                {/* Add your privacy policy content here */}
                <p>This is where your privacy policy content will go...</p>
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
                }
                h1 {
                    margin-bottom: 2rem;
                    color: #333;
                }
            `}</style>
        </div>
    );
};

export default PrivacyPolicy; 