"""
Training script for the churn prediction model.
"""
import argparse
import logging
import sys
from pathlib import Path
from datetime import datetime

import pandas as pd
from sklearn.model_selection import train_test_split

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from config.settings import settings
from src.ml.preprocessing import DataPreprocessor, load_dataset, get_sample_data
from src.ml.model import ChurnModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(settings.base_dir / 'training.log')
    ]
)
logger = logging.getLogger(__name__)


def train_model(
    data_path: str = None,
    test_size: float = 0.2,
    use_smote: bool = True,
    cv_folds: int = 5,
    save_model: bool = True
) -> dict:
    """
    Train the churn prediction model.

    Args:
        data_path: Path to training data (CSV/Excel). Uses sample data if None.
        test_size: Fraction of data to use for testing
        use_smote: Whether to use SMOTE for class balancing
        cv_folds: Number of cross-validation folds
        save_model: Whether to save the trained model

    Returns:
        Dictionary with training results and metrics
    """
    logger.info("="*60)
    logger.info("ChurnShield AI - Model Training")
    logger.info("="*60)

    # Load data
    if data_path:
        logger.info(f"Loading data from: {data_path}")
        df = load_dataset(data_path)
    else:
        logger.info("Using sample data for training")
        df = get_sample_data()

    logger.info(f"Dataset shape: {df.shape}")
    logger.info(f"Columns: {list(df.columns)}")

    # Check for target column
    target_col = settings.target_column
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in data. "
                        f"Available columns: {list(df.columns)}")

    # Show class distribution
    class_dist = df[target_col].value_counts()
    logger.info(f"Class distribution:\n{class_dist}")

    # Initialize preprocessor
    logger.info("Initializing data preprocessor...")
    preprocessor = DataPreprocessor()

    # Fit and transform data
    X, y = preprocessor.fit_transform(df, target_col)
    feature_names = preprocessor.get_feature_names()

    logger.info(f"Transformed features shape: {X.shape}")
    logger.info(f"Number of features: {len(feature_names)}")

    # Split data
    logger.info(f"Splitting data (test_size={test_size})...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=42,
        stratify=y
    )
    logger.info(f"Training set: {X_train.shape[0]} samples")
    logger.info(f"Test set: {X_test.shape[0]} samples")

    # Initialize model
    logger.info("Initializing XGBoost model...")
    model = ChurnModel(use_smote=use_smote)

    # Cross-validation
    logger.info(f"Running {cv_folds}-fold cross-validation...")
    cv_results = model.cross_validate(X_train, y_train, cv=cv_folds)

    logger.info(f"CV Accuracy: {cv_results['cv_accuracy_mean']:.4f} (+/- {cv_results['cv_accuracy_std']:.4f})")
    logger.info(f"CV ROC-AUC: {cv_results['cv_roc_auc_mean']:.4f} (+/- {cv_results['cv_roc_auc_std']:.4f})")
    logger.info(f"CV F1 Score: {cv_results['cv_f1_mean']:.4f} (+/- {cv_results['cv_f1_std']:.4f})")

    # Train final model
    logger.info("Training final model on full training set...")
    model.fit(X_train, y_train, feature_names=feature_names)

    # Evaluate on test set
    logger.info("Evaluating on test set...")
    metrics = model.evaluate(X_test, y_test)

    logger.info("="*40)
    logger.info("Test Set Metrics:")
    logger.info("="*40)
    logger.info(f"Accuracy:  {metrics['accuracy']:.4f}")
    logger.info(f"Precision: {metrics['precision']:.4f}")
    logger.info(f"Recall:    {metrics['recall']:.4f}")
    logger.info(f"F1 Score:  {metrics['f1_score']:.4f}")
    logger.info(f"ROC-AUC:   {metrics['roc_auc']:.4f}")
    logger.info(f"PR-AUC:    {metrics['pr_auc']:.4f}")
    logger.info(f"Confusion Matrix:\n{metrics['confusion_matrix']}")

    # Get feature importance
    feature_importance = model.get_feature_importance(feature_names)
    logger.info("\nTop 10 Important Features:")
    for i, (feat, imp) in enumerate(list(feature_importance.items())[:10], 1):
        logger.info(f"  {i}. {feat}: {imp:.4f}")

    # Save model and preprocessor
    if save_model:
        # Ensure models directory exists
        settings.models_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"\nSaving model to: {settings.model_path}")
        model.save(str(settings.model_path))

        logger.info(f"Saving preprocessor to: {settings.preprocessor_path}")
        preprocessor.save(str(settings.preprocessor_path))

    # Compile results
    results = {
        'training_date': datetime.utcnow().isoformat(),
        'dataset_size': len(df),
        'train_size': len(X_train),
        'test_size': len(X_test),
        'num_features': len(feature_names),
        'cross_validation': cv_results,
        'test_metrics': metrics,
        'feature_importance': dict(list(feature_importance.items())[:20]),
        'model_path': str(settings.model_path),
        'preprocessor_path': str(settings.preprocessor_path)
    }

    logger.info("\n" + "="*60)
    logger.info("Training completed successfully!")
    logger.info("="*60)

    return results


def main():
    """Main entry point for training script."""
    parser = argparse.ArgumentParser(
        description='Train the ChurnShield AI churn prediction model'
    )
    parser.add_argument(
        '--data', '-d',
        type=str,
        default=None,
        help='Path to training data (CSV/Excel). Uses sample data if not provided.'
    )
    parser.add_argument(
        '--test-size', '-t',
        type=float,
        default=0.2,
        help='Fraction of data for testing (default: 0.2)'
    )
    parser.add_argument(
        '--no-smote',
        action='store_true',
        help='Disable SMOTE for class balancing'
    )
    parser.add_argument(
        '--cv-folds', '-cv',
        type=int,
        default=5,
        help='Number of cross-validation folds (default: 5)'
    )
    parser.add_argument(
        '--no-save',
        action='store_true',
        help='Do not save the trained model'
    )

    args = parser.parse_args()

    try:
        results = train_model(
            data_path=args.data,
            test_size=args.test_size,
            use_smote=not args.no_smote,
            cv_folds=args.cv_folds,
            save_model=not args.no_save
        )

        # Print summary
        print("\n" + "="*60)
        print("TRAINING SUMMARY")
        print("="*60)
        print(f"Dataset Size: {results['dataset_size']}")
        print(f"Test Accuracy: {results['test_metrics']['accuracy']:.4f}")
        print(f"Test ROC-AUC: {results['test_metrics']['roc_auc']:.4f}")
        print(f"Model saved to: {results['model_path']}")

    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise


if __name__ == "__main__":
    main()
