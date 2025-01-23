  <div className="modal">
    <div className="modal-header">
      <h2>{title}</h2>
      <button className="close-button" onClick={onClose}>×</button>
    </div>
    {children}

    <style jsx>{`
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        background: linear-gradient(
          135deg,
          #e6f0ff,
          #fff0f9,
          #f2f6ff
        );
        background-size: 200% 200%;
        animation: gradientAnimation 15s ease infinite;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }

      @keyframes gradientAnimation {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }

      h2 {
        margin: 0;
        font-size: 20px;
        color: #333;
      }

      .close-button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #333;
        padding: 4px 8px;
      }
    `}</style>
  </div> 