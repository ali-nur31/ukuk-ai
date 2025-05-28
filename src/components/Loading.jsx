import '../styles/components/_loading.scss';

const Loading = () => {
    return (
        <div className="loading-spinner">
            <div className="spinner">
                <div>
                    <div></div>
                    <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
                </div>
            </div>
        </div>

    );
};

export default Loading;